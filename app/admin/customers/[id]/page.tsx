'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatDateTime, formatCurrency, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import {
  ArrowLeft, Mail, Phone, MapPin, ShoppingBag,
  Ban, CheckCircle, AlertTriangle, Save, Truck, CreditCard,
} from 'lucide-react';
import AddressForm from '@/components/AddressForm';
import { AddressData, EMPTY_ADDRESS, displayAddress, parseAddress } from '@/lib/address';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentMethodName: string | null;
  deliveryMethod: string;
  deliveryAddress: string | null;
  items: OrderItem[];
}

interface Customer {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  banned: boolean;
  createdAt: string;
  orders: Order[];
}

const DELIVERY_LABEL: Record<string, string> = {
  LALAMOVE: 'Lalamove',
  SHOPEE: 'Shopee',
  JNT: 'J&T Express',
};

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editPhone, setEditPhone] = useState('');
  const [editAddressData, setEditAddressData] = useState<AddressData>(EMPTY_ADDRESS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(res => res.json())
      .then((data: Customer[]) => {
        const found = data.find(c => c.id === params.id) ?? null;
        // Sort orders newest first
        if (found) found.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCustomer(found);
        setEditPhone(found?.phone ?? '');
        setEditAddressData(parseAddress(found?.address) ?? EMPTY_ADDRESS);
        setIsLoading(false);
      });
  }, [params.id]);

  const handleBanToggle = async () => {
    if (!customer) return;
    const res = await fetch(`/api/admin/customers/${customer.id}/ban`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setCustomer(prev => prev ? { ...prev, banned: data.banned } : null);
  };

  const handleSaveContact = async () => {
    if (!customer) return;
    setIsSaving(true);
    const addressJson = JSON.stringify(editAddressData);
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: editPhone, address: addressJson }),
    });
    if (res.ok) {
      setCustomer(prev => prev ? { ...prev, phone: editPhone, address: addressJson } : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-64 bg-white rounded-xl animate-pulse mb-4" />
        <div className="h-96 bg-white rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Customer not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const totalSpent = customer.orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="p-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      {/* Customer info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">

          {/* Identity + stats */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-600">{customer.name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                {customer.customerId && (
                  <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    CID: {customer.customerId}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  customer.banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {customer.banned ? 'Banned' : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">Member since {formatDate(customer.createdAt)}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {displayAddress(customer.address)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-center min-w-[80px]">
              <p className="text-xs text-gray-500 mb-0.5">Orders</p>
              <p className="text-xl font-bold text-gray-900">{customer.orders.length}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg px-4 py-3 text-center min-w-[100px]">
              <p className="text-xs text-indigo-500 mb-0.5">Total Spent</p>
              <p className="text-xl font-bold text-indigo-600">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        {customer.banned && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 mt-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> This account has been banned.
          </div>
        )}

        {/* Editable contact + actions */}
        <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              placeholder="Phone number"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Address */}
          <div>
            <p className="flex items-center gap-1.5 text-sm text-gray-500 font-medium mb-2">
              <MapPin className="h-4 w-4 text-gray-400" /> Delivery Address
            </p>
            <AddressForm value={editAddressData} onChange={setEditAddressData} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSaveContact}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save Contact'}
            </button>
            <button
              onClick={handleBanToggle}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                customer.banned
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {customer.banned
                ? <><CheckCircle className="h-4 w-4" /> Unban</>
                : <><Ban className="h-4 w-4" /> Ban</>}
            </button>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <ShoppingBag className="h-4 w-4 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Order History</h2>
          <span className="ml-1 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {customer.orders.length}
          </span>
        </div>

        {customer.orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-200" />
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date Ordered</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Payment</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.orders.map(order => {
                  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      {/* Order number */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-gray-800">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {order.items.map(item => (
                            <p key={item.id} className="text-gray-700 text-xs">
                              {item.product.name}
                              <span className="text-gray-400 ml-1">×{item.quantity}</span>
                            </p>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{totalQty} item{totalQty !== 1 ? 's' : ''} total</p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`badge text-xs ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <CreditCard className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {order.paymentMethodName ?? '—'}
                        </span>
                      </td>

                      {/* Delivery */}
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-indigo-600">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
