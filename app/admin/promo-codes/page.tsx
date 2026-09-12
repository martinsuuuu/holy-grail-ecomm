'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, X, Percent, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

function statusOf(p: PromoCode): { label: string; className: string } {
  if (p.expiresAt && new Date(p.expiresAt) < new Date()) {
    return { label: 'Expired', className: 'bg-stone-100 text-stone-500' };
  }
  if (!p.isActive) {
    return { label: 'Inactive', className: 'bg-stone-100 text-stone-500' };
  }
  return { label: 'Active', className: 'bg-emerald-100 text-emerald-700' };
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newValue, setNewValue] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [addError, setAddError] = useState('');

  const fetchCodes = () =>
    fetch('/api/admin/promo-codes')
      .then((r) => r.json())
      .then((data) => {
        setCodes(data);
        setIsLoading(false);
      });

  useEffect(() => { fetchCodes(); }, []);

  const handleAdd = async () => {
    setAddError('');
    const value = parseFloat(newValue);
    if (!newCode.trim()) { setAddError('Code is required'); return; }
    if (!value || value <= 0) { setAddError('Enter a valid value'); return; }

    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode,
        type: newType,
        value,
        expiresAt: newExpiresAt || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error || 'Failed to create promo code');
      return;
    }

    setShowAddModal(false);
    setNewCode('');
    setNewValue('');
    setNewExpiresAt('');
    fetchCodes();
  };

  const handleToggle = async (p: PromoCode) => {
    await fetch(`/api/admin/promo-codes/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    fetchCodes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code? This cannot be undone.')) return;
    await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
    fetchCodes();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-black text-espresso flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary-600" />
            Promo Codes
          </h1>
          <p className="text-sm text-stone-500 mt-1">Create and manage discount codes for checkout</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError(''); setNewCode(''); setNewValue(''); setNewExpiresAt(''); }}
          className="btn-primary flex items-center gap-2 text-sm py-2"
        >
          <Plus className="h-4 w-4" />
          New Promo Code
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-stone-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : codes.length === 0 ? (
        <div className="border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center text-stone-400 text-sm">
          No promo codes yet. Create one to offer discounts at checkout.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-left">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((p) => {
                const status = statusOf(p);
                return (
                  <tr key={p.id} className="border-t border-stone-100 hover:bg-stone-50/60">
                    <td className="px-4 py-3 font-mono font-semibold text-espresso">{p.code}</td>
                    <td className="px-4 py-3 text-espresso/80 flex items-center gap-1.5">
                      {p.type === 'PERCENT' ? <Percent className="h-3.5 w-3.5 text-stone-400" /> : <DollarSign className="h-3.5 w-3.5 text-stone-400" />}
                      {p.type === 'PERCENT' ? `${p.value}%` : formatCurrency(p.value)}
                    </td>
                    <td className="px-4 py-3 text-espresso/60">{p.expiresAt ? formatDate(p.expiresAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-espresso/50">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(p)}
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors text-stone-500"
                        >
                          {p.isActive ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-stone-400" />}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-warm w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-espresso">New Promo Code</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-espresso/80 block mb-1.5">Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-espresso/80 block mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PERCENT', 'FIXED'] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer text-sm transition-all ${
                        newType === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <input type="radio" name="promoType" value={t} checked={newType === t} onChange={() => setNewType(t)} className="hidden" />
                      {t === 'PERCENT' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                      {t === 'PERCENT' ? 'Percent Off' : 'Fixed Amount'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-espresso/80 block mb-1.5">
                  {newType === 'PERCENT' ? 'Percent (e.g. 10 for 10%)' : 'Amount (₱)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newType === 'PERCENT' ? '10' : '500'}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-espresso/80 block mb-1.5">Expires (optional)</label>
                <input
                  type="date"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {addError && <p className="text-red-600 text-xs">{addError}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 rounded-full border border-stone-200 text-sm text-espresso/80 hover:bg-stone-50">
                Cancel
              </button>
              <button onClick={handleAdd} className="flex-1 py-2 rounded-full bg-espresso hover:bg-primary-800 text-cream text-sm font-medium">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
