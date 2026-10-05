'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';
import { UserCog, Ban, CheckCircle, Search, Plus, Edit, X, Eye, EyeOff, ShieldCheck, Truck, User as UserIcon } from 'lucide-react';

interface Account {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'SHIPPER' | 'CUSTOMER';
  banned: boolean;
  createdAt: string;
}

type ModalMode = 'add' | 'edit';
type RoleFilter = 'all' | 'ADMIN' | 'SHIPPER' | 'CUSTOMER';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'CUSTOMER' as Account['role'] };

const ROLE_META: Record<Account['role'], { label: string; icon: typeof ShieldCheck; className: string }> = {
  ADMIN: { label: 'Admin', icon: ShieldCheck, className: 'bg-primary-100 text-primary-700' },
  SHIPPER: { label: 'Shipper', icon: Truck, className: 'bg-sky-100 text-sky-700' },
  CUSTOMER: { label: 'Customer', icon: UserIcon, className: 'bg-stone-100 text-stone-700' },
};

function RoleBadge({ role }: { role: Account['role'] }) {
  const meta = ROLE_META[role] ?? ROLE_META.CUSTOMER;
  const Icon = meta.icon;
  return (
    <span className={`badge text-xs inline-flex items-center gap-1 ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export default function AdminAccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const [modal, setModal] = useState<{ mode: ModalMode; account?: Account } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch('/api/admin/accounts')
      .then(res => res.json())
      .then(data => { setAccounts(data); setIsLoading(false); });
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError('');
    setShowPassword(false);
    setModal({ mode: 'add' });
  };

  const openEdit = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    setForm({ name: account.name, email: account.email, password: '', phone: account.phone ?? '', role: account.role });
    setFormError('');
    setShowPassword(false);
    setModal({ mode: 'edit', account });
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
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create account');
      } else {
        setAccounts(prev => [data, ...prev]);
        closeModal();
      }
    } else if (modal?.mode === 'edit' && modal.account) {
      const res = await fetch(`/api/admin/accounts/${modal.account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          password: form.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update account');
      } else {
        setAccounts(prev => prev.map(a => a.id === modal.account!.id ? { ...a, ...data } : a));
        closeModal();
      }
    }

    setIsSaving(false);
  };

  const handleBanToggle = async (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    const res = await fetch(`/api/admin/accounts/${accountId}/ban`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, banned: data.banned } : a));
    }
  };

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.customerId ?? '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleTabs: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: `All (${accounts.length})` },
    { value: 'ADMIN', label: `Admins (${accounts.filter(a => a.role === 'ADMIN').length})` },
    { value: 'SHIPPER', label: `Shippers (${accounts.filter(a => a.role === 'SHIPPER').length})` },
    { value: 'CUSTOMER', label: `Customers (${accounts.filter(a => a.role === 'CUSTOMER').length})` },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Accounts</h1>
          <p className="text-stone-500 text-sm mt-1">Every account on the site — admins, shippers, and customers — in one place</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, email, or customer ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          {roleTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                roleFilter === tab.value ? 'bg-white text-espresso shadow-sm' : 'text-stone-500 hover:text-espresso'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Account</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Joined</th>
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
                <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                  <UserCog className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p>No accounts found</p>
                </td>
              </tr>
            ) : (
              filtered.map(account => {
                const isSelf = account.id === session?.user?.id;
                return (
                  <tr key={account.id} className="hover:bg-stone-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-600">{account.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-espresso">
                            {account.name}
                            {isSelf && <span className="text-xs text-stone-400 font-normal ml-1.5">(you)</span>}
                          </p>
                          <p className="text-xs text-stone-500">{account.email}</p>
                          {account.customerId && (
                            <span className="font-mono text-[11px] text-primary-600">{account.customerId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={account.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">{account.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-stone-600">{formatDate(account.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge text-xs ${account.banned ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {account.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => openEdit(e, account)}
                          className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                          title="Edit account"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={e => handleBanToggle(e, account.id)}
                          disabled={isSelf}
                          title={isSelf ? "You can't ban your own account" : undefined}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            account.banned
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {account.banned
                            ? <><CheckCircle className="h-3 w-3" /> Unban</>
                            : <><Ban className="h-3 w-3" /> Ban</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
                {modal.mode === 'add' ? 'Add Account' : 'Edit Account'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{formError}</div>
              )}

              <div>
                <label className="label">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADMIN', 'SHIPPER', 'CUSTOMER'] as const).map(r => {
                    const meta = ROLE_META[r];
                    const Icon = meta.icon;
                    const disabled = modal.mode === 'edit' && modal.account?.id === session?.user?.id;
                    return (
                      <button
                        key={r}
                        type="button"
                        disabled={disabled}
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          form.role === r
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-stone-200 text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Juan dela Cruz"
                    className="input-field"
                  />
                </div>

                <div className="col-span-2">
                  <label className="label">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
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
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Saving...' : modal.mode === 'add' ? 'Create Account' : 'Save Changes'}
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
