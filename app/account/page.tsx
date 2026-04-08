'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { ShoppingBag, Clock, ChevronRight, Package, User, Phone, MapPin, Lock, Save, Pencil, X } from 'lucide-react';
import AddressForm from '@/components/AddressForm';
import { AddressData, EMPTY_ADDRESS, displayAddress, parseAddress } from '@/lib/address';

interface Order {
  id: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  reservationExpiry: string;
  depositConfirmed: boolean;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      type: string;
    };
  }>;
}

interface Profile {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

export default function AccountPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddressData, setEditAddressData] = useState<AddressData>(EMPTY_ADDRESS);
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch('/api/orders').then(r => r.ok ? r.json() : []),
        fetch('/api/profile').then(r => r.ok ? r.json() : null),
      ]).then(([ordersData, profileData]) => {
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProfile(profileData);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, [session]);

  const startEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditPhone(profile.phone ?? '');
    setEditAddressData(parseAddress(profile.address) ?? EMPTY_ADDRESS);
    setEditCurrentPassword('');
    setEditNewPassword('');
    setSaveError('');
    setIsEditingProfile(true);
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    const body: Record<string, string> = {
      name: editName,
      phone: editPhone,
      address: JSON.stringify(editAddressData),
    };
    if (editNewPassword) {
      body.currentPassword = editCurrentPassword;
      body.newPassword = editNewPassword;
    }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error ?? 'Failed to save');
    } else {
      setProfile(data);
      await updateSession({ name: data.name });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditingProfile(false);
    }
    setIsSaving(false);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-indigo-600">
                  {(profile?.name ?? session?.user.name)?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile?.name ?? session?.user.name}</h1>
                <p className="text-gray-500 text-sm">{profile?.email ?? session?.user.email}</p>
                {profile?.customerId && (
                  <p className="font-mono text-xs text-indigo-600 font-semibold mt-0.5">
                    Customer ID: {profile.customerId}
                  </p>
                )}
                {!isEditingProfile && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                    {profile?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {profile.phone}
                      </span>
                    )}
                    {profile?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {displayAddress(profile.address)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {!isEditingProfile && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>

          {isEditingProfile && (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Phone number"
                  autoComplete="tel"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Address */}
              <div>
                <p className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Delivery Address
                </p>
                <AddressForm value={editAddressData} onChange={setEditAddressData} />
              </div>

              {/* Change password */}
              <div className="pt-1">
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Change Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="password"
                    value={editCurrentPassword}
                    onChange={e => setEditCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={e => setEditNewPassword(e.target.value)}
                    placeholder="New password"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editName.trim()}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">My Orders</h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No orders yet</h3>
              <p className="text-gray-500 text-sm mb-4">Start shopping to see your orders here</p>
              <Link href="/shop" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(order.createdAt)}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.items.slice(0, 2).map((item) => (
                            <span key={item.id} className="text-xs text-gray-500">
                              {item.product.name} x{item.quantity}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-xs text-gray-400">+{order.items.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                      {order.items.some(i => i.product.type === 'PASABUY')
                        ? <span className="badge text-xs bg-purple-100 text-purple-700">Pasabuy</span>
                        : <span className="badge text-xs bg-emerald-100 text-emerald-700">On Hand</span>
                      }
                      <span className="font-bold text-indigo-600 text-sm">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      {order.status === 'PENDING_DEPOSIT' && (
                        <div className="flex items-center gap-1 text-amber-600 text-xs">
                          <Clock className="h-3 w-3" />
                          Deposit needed
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{order.deliveryMethod}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
