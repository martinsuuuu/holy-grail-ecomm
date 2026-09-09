'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { Users, Ban, CheckCircle, Search, Plus, Edit, X, Eye, EyeOff } from 'lucide-react';
import AddressForm from '@/components/AddressForm';
import { AddressData, EMPTY_ADDRESS, parseAddress } from '@/lib/address';

interface Customer {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  banned: boolean;
  createdAt: string;
  orders: Array<{ id: string; totalAmount: number }>;
}

type ModalMode = 'add' | 'edit';

const emptyForm = { name: '', email: '', password: '', phone: '' };
const emptyAddress: AddressData = EMPTY_ADDRESS;

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modal, setModal] = useState<{ mode: ModalMode; customer?: Customer } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formAddress, setFormAddress] = useState<AddressData>(emptyAddress);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(res => res.json())
      .then(data => { setCustomers(data); setIsLoading(false); });
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setFormAddress(emptyAddress);
    setFormError('');
    setShowPassword(false);
    setModal({ mode: 'add' });
  };

  const openEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setForm({
      name: customer.name,
      email: customer.email,
      password: '',
      phone: customer.phone ?? '',
    });
    setFormAddress(parseAddress(customer.address) ?? emptyAddress);
    setFormError('');
    setShowPassword(false);
    setModal({ mode: 'edit', customer });
  };

  const closeModal = () => setModal(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');

    if (modal?.mode === 'add') {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        setFormError('Name, email, and password are required.');
        setIsSaving(false);
        return;
      }
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password, address: JSON.stringify(formAddress) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create customer');
      } else {
        setCustomers(prev => [{ ...data, orders: [] }, ...prev]);
        closeModal();
      }
    } else if (modal?.mode === 'edit' && modal.customer) {
      const res = await fetch(`/api/admin/customers/${modal.customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: JSON.stringify(formAddress),
          password: form.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update customer');
      } else {
        setCustomers(prev => prev.map(c =>
          c.id === modal.customer!.id ? { ...c, ...data } : c
        ));
        closeModal();
      }
    }

    setIsSaving(false);
  };

  const handleBanToggle = async (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    const res = await fetch(`/api/admin/customers/${customerId}/ban`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, banned: data.banned } : c));
    }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.customerId ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Customers</h1>
          <p className="text-stone-500 text-sm mt-1">{customers.length} registered customers</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Customer ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Joined</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Orders</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Actions</th>
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
                <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p>No customers found</p>
                </td>
              </tr>
            ) : (
              filtered.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-stone-50/60 cursor-pointer"
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded">
                        {customer.customerId ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-600">{customer.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-espresso">{customer.name}</p>
                          <p className="text-xs text-stone-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">{formatDate(customer.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-espresso">{customer.orders.length}</td>
                    <td className="px-6 py-4">
                      <span className={`badge text-xs ${customer.banned ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {customer.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => openEdit(e, customer)}
                          className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={e => handleBanToggle(e, customer.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${
                            customer.banned
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {customer.banned
                            ? <><CheckCircle className="h-3 w-3" /> Unban</>
                            : <><Ban className="h-3 w-3" /> Ban</>}
                        </button>
                      </div>
                    </td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-espresso/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-warm w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="text-lg font-display font-semibold text-espresso">
                {modal.mode === 'add' ? 'Add Customer' : 'Edit Customer'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name {modal.mode === 'add' && <span className="text-red-500">*</span>}</label>
                  <input
                    type="text"
                    required={modal.mode === 'add'}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Juan dela Cruz"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="label">Email {modal.mode === 'add' && <span className="text-red-500">*</span>}</label>
                  <input
                    type="email"
                    required={modal.mode === 'add'}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="juan@example.com"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="label">
                    Password
                    {modal.mode === 'add'
                      ? <span className="text-red-500"> *</span>
                      : <span className="text-stone-400 font-normal text-xs ml-1">(leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={modal.mode === 'add'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={modal.mode === 'edit' ? '••••••••' : 'Min. 8 characters'}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="09xxxxxxxxx"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="label">Delivery Address</label>
                  <div className="mt-1">
                    <AddressForm value={formAddress} onChange={setFormAddress} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Saving...' : modal.mode === 'add' ? 'Create Customer' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
