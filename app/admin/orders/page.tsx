'use client';

import { deliveryLabel } from '@/lib/delivery';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { ShoppingBag, CheckCircle, Search, Filter, Package, Eye, Truck, ZoomIn, X, Calendar, Plus, UserCog, Phone, FileText, Trash2, QrCode, Loader2 } from 'lucide-react';
import ManualOrderModal from '@/components/admin/ManualOrderModal';
import InvoicePreviewModal from '@/components/InvoicePreviewModal';
import { isOrderPaid } from '@/lib/invoice';

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

interface Order {
  id: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  promoCode: string | null;
  discountAmount: number;
  depositProof: string | null;
  depositConfirmed: boolean;
  paymentMethodName?: string | null;
  paymentQr?: string | null;
  reservationExpiry: string;
  createdAt: string;
  user: {
    id: string;
    customerId: string | null;
    name: string;
    email: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      imageUrl: string | null;
      type: string;
    };
  }>;
  statusHistory?: StatusHistoryEntry[];
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Staff',
  SHIPPER: 'Shipper',
  CUSTOMER: 'Customer',
};

// Re-encodes the chosen QR image as a PNG capped at 700px — QR codes stay scannable at that size
// and it keeps the order list light, since the QR is stored on the order itself.
function qrFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 700 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    img.src = url;
  });
}

function orderType(order: Order): 'PASABUY' | 'ONHAND' {
  return order.items.some(i => i.product.type === 'PASABUY') ? 'PASABUY' : 'ONHAND';
}

// The most recent staff (non-customer) account to act on this order — who
// confirmed it, shipped it, etc. There can be several staff/warehouse
// accounts now, so the list needs to name the specific one, not just "Staff".
function latestHandler(order: Order): { name: string; role: string } | null {
  const staffEntries = (order.statusHistory ?? []).filter(h => h.actorRole !== 'CUSTOMER');
  if (staffEntries.length === 0) return null;
  const last = staffEntries[staffEntries.length - 1];
  return { name: last.actorName, role: last.actorRole };
}

function HandledByCell({ order }: { order: Order }) {
  const handler = latestHandler(order);
  if (!handler) {
    return <span className="text-xs text-stone-300 italic">Not yet handled</span>;
  }
  return (
    <div>
      <p className="text-sm text-espresso truncate max-w-[160px]">{handler.name}</p>
      <p className="text-xs text-stone-400">{ROLE_LABEL[handler.role] ?? handler.role}</p>
    </div>
  );
}

function OrderTypeBadge({ type }: { type: 'PASABUY' | 'ONHAND' }) {
  return type === 'PASABUY'
    ? <span className="badge text-xs bg-plum-100 text-plum-700">Personal Shopping</span>
    : <span className="badge text-xs bg-emerald-100 text-emerald-700">On Hand</span>;
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    fetch('/api/orders?all=true')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setIsLoading(false);
        const targetId = searchParams.get('order');
        if (targetId) {
          const match = data.find((o: Order) => o.id === targetId);
          if (match) setSelectedOrder(match);
        }
      });
  }, []);

  const handleConfirmDeposit = async (orderId: string) => {
    setIsConfirming(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositConfirmed: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, ...updated } : prev);
    }
    setIsConfirming(false);
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, ...updated } : prev);
    }
  };

  const handleQrUpload = async (orderId: string, file: File) => {
    setQrError('');
    if (!file.type.startsWith('image/')) { setQrError('Please choose an image file.'); return; }
    setIsUploadingQr(true);
    try {
      const paymentQr = await qrFileToDataUrl(file);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentQr }),
      });
      const data = await res.json();
      if (!res.ok) { setQrError(data.error || 'Upload failed'); return; }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data } : o));
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, ...data } : prev);
    } catch (e) {
      setQrError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploadingQr(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    const ref = order.id.slice(-8).toUpperCase();
    const paid = ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status);
    const ok = window.confirm(
      `Delete order #${ref} permanently?\n\n` +
      `• Its items, history, notifications and invoice are removed.\n` +
      (order.status === 'CANCELLED'
        ? '• Inventory was already released when it was cancelled.\n'
        : paid
          ? '• Deducted stock is returned to inventory.\n'
          : '• Reserved stock is released back to inventory.\n') +
      `\nThis cannot be undone.`
    );
    if (!ok) return;
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'DELETE' });
    if (res.ok) {
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setSelectedOrder(prev => (prev?.id === order.id ? null : prev));
      setShowInvoice(false);
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || 'Could not delete the order');
    }
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = o.id.toLowerCase().includes(q) ||
      o.user.name.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q) ||
      (o.user.customerId ?? '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const orderDate = new Date(o.createdAt);
    const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom + 'T00:00:00');
    const matchesTo   = !dateTo   || orderDate <= new Date(dateTo   + 'T23:59:59');
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'AWAITING_QR', label: 'Awaiting BDO QR' },
    { value: 'SALES_ORDER', label: 'Sales Order (Reserved)' },
    { value: 'PENDING_DEPOSIT', label: 'Pending Deposit' },
    { value: 'DEPOSIT_SUBMITTED', label: 'Deposit Submitted' },
    { value: 'WAITING_FOR_ARRIVAL', label: 'Waiting for Arrival' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const hasDateFilter = dateFrom || dateTo;

  return (
    <>
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Orders</h1>
          <p className="text-stone-500 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <button onClick={() => setShowManualOrderModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Row 1: Search + Status */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field py-2"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date range */}
        <div className="flex flex-wrap items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
          <Calendar className="h-4 w-4 text-stone-400 flex-shrink-0" />
          <span className="text-sm text-stone-500 font-medium">Date Range</span>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => setDateFrom(e.target.value)}
              className="input-field py-1.5 text-sm flex-1 min-w-[140px]"
            />
            <span className="text-stone-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
              className="input-field py-1.5 text-sm flex-1 min-w-[140px]"
            />
            {hasDateFilter && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium whitespace-nowrap"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders list */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Handled By</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-stone-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                    <p>No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-stone-50/60 cursor-pointer ${selectedOrder?.id === order.id ? 'bg-primary-50' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-medium text-espresso">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-stone-500">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-espresso">{order.user.name}</p>
                      <p className="text-xs text-stone-500">{order.user.email}</p>
                      {order.user.customerId && (
                        <span className="font-mono text-xs text-primary-600">{order.user.customerId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <OrderTypeBadge type={orderType(order)} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge text-xs ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <HandledByCell order={order} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-espresso">{formatCurrency(order.totalAmount)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Order details */}
        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6">
          {selectedOrder ? (
            <div>
              <div className="mb-4 pb-4 border-b border-stone-100">
                <h3 className="font-display font-semibold text-espresso">Order #{selectedOrder.id.slice(-8).toUpperCase()}</h3>
                <p className="text-xs text-stone-500 mt-1">{formatDateTime(selectedOrder.createdAt)}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`badge text-xs ${getOrderStatusColor(selectedOrder.status)}`}>
                    {getOrderStatusLabel(selectedOrder.status)}
                  </span>
                  <OrderTypeBadge type={orderType(selectedOrder)} />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Customer</span>
                  <div className="text-right">
                    <p className="font-medium">{selectedOrder.user.name}</p>
                    {selectedOrder.user.phone && (
                      <p className="text-xs text-stone-500 flex items-center justify-end gap-1">
                        <Phone className="h-3 w-3" /> {selectedOrder.user.phone}
                      </p>
                    )}
                    {selectedOrder.user.customerId && (
                      <p className="font-mono text-xs text-primary-600">CID: {selectedOrder.user.customerId}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Delivery</span>
                  <span className="font-medium">{deliveryLabel(selectedOrder.deliveryMethod)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Order Type</span>
                  <span className="font-medium">
                    {orderType(selectedOrder) === 'PASABUY' ? 'Personal Shopping (Pre-order)' : 'On Hand'}
                  </span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Discount ({selectedOrder.promoCode})</span>
                    <span className="font-medium text-emerald-700">-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Total</span>
                  <span className="font-bold text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2">Items</h4>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <span className="text-stone-700 truncate">{item.product.name} x{item.quantity}</span>
                      {item.product.type === 'PASABUY' && (
                        <span className="text-xs bg-plum-100 text-plum-600 px-1 rounded flex-shrink-0">PB</span>
                      )}
                    </div>
                    <span className="text-stone-600 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Staff accountability — who confirmed/shipped/handled each step.
                  The customer's own order-placement isn't "handling", so it's
                  excluded here; it's already shown in the Customer field above. */}
              {(() => {
                const staffHistory = (selectedOrder.statusHistory ?? []).filter(h => h.actorRole !== 'CUSTOMER');
                if (staffHistory.length === 0) return null;
                return (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2 flex items-center gap-1.5">
                      <UserCog className="h-3.5 w-3.5" />
                      Handled By
                    </h4>
                    <div className="space-y-2.5">
                      {staffHistory.map((h, i) => (
                        <div key={h.id} className="relative pl-5">
                          {i !== staffHistory.length - 1 && (
                            <span className="absolute left-[3px] top-3 bottom-[-10px] w-px bg-stone-200" />
                          )}
                          <span className="absolute left-0 top-1 h-1.5 w-1.5 rounded-full bg-primary-500" />
                          <p className="text-xs font-medium text-espresso">
                            {getOrderStatusLabel(h.status)}
                            {h.note && <span className="text-stone-400 font-normal"> — {h.note}</span>}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {h.actorName} <span className="text-stone-400">({ROLE_LABEL[h.actorRole] ?? h.actorRole})</span> · {formatDateTime(h.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Deposit proof */}
              {selectedOrder.depositProof && (() => {
                const [imgSrc, noteRaw] = selectedOrder.depositProof!.split('||note:');
                const note = noteRaw?.trim();
                return (
                  <div className="mb-4 p-3 bg-sky-50 rounded-xl">
                    <p className="text-xs font-medium text-sky-800 mb-2">Deposit Proof</p>
                    <div className="relative group w-full">
                      <img
                        src={imgSrc}
                        alt="Deposit proof"
                        className="w-full rounded-xl object-contain max-h-48 cursor-zoom-in border border-sky-200"
                        onClick={() => setLightboxSrc(imgSrc)}
                      />
                      <button
                        onClick={() => setLightboxSrc(imgSrc)}
                        className="absolute top-2 right-2 bg-espresso/40 hover:bg-espresso/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {note && (
                      <p className="text-xs text-sky-700 mt-2 italic">Note: {note}</p>
                    )}
                  </div>
                );
              })()}

              {isOrderPaid(selectedOrder.status) && (
                <button
                  onClick={() => setShowInvoice(true)}
                  className="w-full btn-secondary flex items-center justify-center gap-2 mb-2"
                >
                  <FileText className="h-4 w-4" />
                  Sales Invoice
                </button>
              )}

              {/* BDO Checkout QR — customer can't pay until this is uploaded */}
              {(selectedOrder.status === 'AWAITING_QR' || (selectedOrder.status === 'PENDING_DEPOSIT' && selectedOrder.paymentQr)) && (
                <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(selectedOrder.id, f); }}
                  />
                  <p className="text-xs font-semibold text-violet-900 flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    {selectedOrder.status === 'AWAITING_QR' ? 'BDO Checkout — customer is waiting for a QR' : 'BDO Checkout QR'}
                  </p>
                  {selectedOrder.paymentQr && (
                    <img src={selectedOrder.paymentQr} alt="BDO Checkout QR" className="w-32 h-32 object-contain bg-white border border-violet-200 rounded-lg mt-2 p-1" />
                  )}
                  <p className="text-xs text-violet-800 mt-2">
                    {selectedOrder.status === 'AWAITING_QR'
                      ? `Generate the BDO checkout QR for ${formatCurrency(selectedOrder.totalAmount)} and upload it. The customer is notified and gets 24 hours to pay.`
                      : 'You can replace the QR if it was wrong.'}
                  </p>
                  {qrError && <p className="text-xs text-red-600 mt-2">{qrError}</p>}
                  <button
                    onClick={() => qrInputRef.current?.click()}
                    disabled={isUploadingQr}
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                  >
                    {isUploadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                    {isUploadingQr ? 'Uploading…' : selectedOrder.paymentQr ? 'Replace QR' : 'Upload BDO QR'}
                  </button>
                </div>
              )}

              {/* Actions */}
              {(selectedOrder.status === 'DEPOSIT_SUBMITTED' || selectedOrder.status === 'SALES_ORDER') && !selectedOrder.depositConfirmed && (
                <button
                  onClick={() => handleConfirmDeposit(selectedOrder.id)}
                  disabled={isConfirming}
                  className="w-full btn-success flex items-center justify-center gap-2 mb-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isConfirming ? 'Confirming...' : selectedOrder.status === 'SALES_ORDER' ? 'Confirm Payment' : 'Confirm Deposit'}
                </button>
              )}

              {selectedOrder.status === 'WAITING_FOR_ARRIVAL' && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-2">
                    <Truck className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-700 font-medium">Personal Shopping order — waiting for items to arrive</p>
                  </div>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'CONFIRMED')}
                    className="w-full btn-success flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm Arrival
                  </button>
                </div>
              )}

              {selectedOrder.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'SHIPPED')}
                  className="w-full btn-primary flex items-center justify-center gap-2 mb-2"
                >
                  Mark as Shipped
                </button>
              )}

              {selectedOrder.status === 'SHIPPED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                  className="w-full btn-success flex items-center justify-center gap-2 mb-2"
                >
                  Mark as Delivered
                </button>
              )}

              {(selectedOrder.status === 'AWAITING_QR' || selectedOrder.status === 'PENDING_DEPOSIT' || selectedOrder.status === 'DEPOSIT_SUBMITTED' || selectedOrder.status === 'SALES_ORDER') && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                  className="w-full btn-danger flex items-center justify-center gap-2"
                >
                  Cancel Order
                </button>
              )}

              <button
                onClick={() => handleDeleteOrder(selectedOrder)}
                className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl px-4 py-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Order &amp; Revert Inventory
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-sm py-12">
              <div className="text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                <p>Select an order to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Lightbox */}
    {showInvoice && selectedOrder && isOrderPaid(selectedOrder.status) && (
      <InvoicePreviewModal
        order={{ ...selectedOrder, paymentMethodName: selectedOrder.paymentMethodName ?? null, paymentMethod: null }}
        orderTypeLabel={
          selectedOrder.deliveryMethod === 'WALK_IN'
            ? 'Walk-in'
            : orderType(selectedOrder) === 'PASABUY' ? 'Personal Shopping' : 'On Hand'
        }
        onClose={() => setShowInvoice(false)}
      />
    )}

    {lightboxSrc && (
      <div
        className="fixed inset-0 bg-espresso/80 flex items-center justify-center z-50 p-4"
        onClick={() => setLightboxSrc(null)}
      >
        <button
          className="absolute top-4 right-4 text-white hover:text-stone-300"
          onClick={() => setLightboxSrc(null)}
        >
          <X className="h-6 w-6" />
        </button>
        <img
          src={lightboxSrc}
          alt="Deposit proof"
          className="max-w-full max-h-full rounded-xl object-contain"
          onClick={e => e.stopPropagation()}
        />
      </div>
    )}

    {/* Manual (walk-in) order creation */}
    {showManualOrderModal && (
      <ManualOrderModal
        onClose={() => setShowManualOrderModal(false)}
        onCreated={(order) => {
          setOrders(prev => [order, ...prev]);
          setSelectedOrder(order);
          setShowManualOrderModal(false);
        }}
      />
    )}
    </>
  );
}
