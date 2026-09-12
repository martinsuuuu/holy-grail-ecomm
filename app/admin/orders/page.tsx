'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { ShoppingBag, CheckCircle, Search, Filter, Package, Eye, Truck, ZoomIn, X, Calendar } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  promoCode: string | null;
  discountAmount: number;
  depositProof: string | null;
  depositConfirmed: boolean;
  reservationExpiry: string;
  createdAt: string;
  user: {
    id: string;
    customerId: string | null;
    name: string;
    email: string;
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
}

function orderType(order: Order): 'PASABUY' | 'ONHAND' {
  return order.items.some(i => i.product.type === 'PASABUY') ? 'PASABUY' : 'ONHAND';
}

function OrderTypeBadge({ type }: { type: 'PASABUY' | 'ONHAND' }) {
  return type === 'PASABUY'
    ? <span className="badge text-xs bg-plum-100 text-plum-700">Pasabuy</span>
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-stone-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
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
                    {selectedOrder.user.customerId && (
                      <p className="font-mono text-xs text-primary-600">CID: {selectedOrder.user.customerId}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Delivery</span>
                  <span className="font-medium">{selectedOrder.deliveryMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Order Type</span>
                  <span className="font-medium">
                    {orderType(selectedOrder) === 'PASABUY' ? 'Pasabuy (Pre-order)' : 'On Hand'}
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

              {/* Actions */}
              {selectedOrder.status === 'DEPOSIT_SUBMITTED' && !selectedOrder.depositConfirmed && (
                <button
                  onClick={() => handleConfirmDeposit(selectedOrder.id)}
                  disabled={isConfirming}
                  className="w-full btn-success flex items-center justify-center gap-2 mb-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isConfirming ? 'Confirming...' : 'Confirm Deposit'}
                </button>
              )}

              {selectedOrder.status === 'WAITING_FOR_ARRIVAL' && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-2">
                    <Truck className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-700 font-medium">Pasabuy order — waiting for items to arrive</p>
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

              {(selectedOrder.status === 'PENDING_DEPOSIT' || selectedOrder.status === 'DEPOSIT_SUBMITTED') && (
                <button
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                  className="w-full btn-danger flex items-center justify-center gap-2"
                >
                  Cancel Order
                </button>
              )}
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
    </>
  );
}
