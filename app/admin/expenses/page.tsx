'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Edit, Trash2, DollarSign, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

const EXPENSE_CATEGORIES = ['Operations', 'Inventory', 'Marketing', 'Payroll', 'Utilities', 'Other'];

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    const res = await fetch('/api/admin/expenses');
    const data = await res.json();
    setExpenses(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount.toString(),
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      notes: expense.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const url = editingExpense ? `/api/admin/expenses/${editingExpense.id}` : '/api/admin/expenses';
    const method = editingExpense ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to save expense');
    } else {
      setShowModal(false);
      fetchExpenses();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    category: cat,
    total: filtered.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Expenses</h1>
          <p className="text-stone-500 text-sm mt-1">Track business expenses</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Total Expenses</p>
              <p className="text-lg font-bold text-espresso">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        {byCategory.slice(0, 3).map(cat => (
          <div key={cat.category} className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-4">
            <p className="text-xs text-stone-500">{cat.category}</p>
            <p className="text-lg font-bold text-espresso mt-1">{formatCurrency(cat.total)}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Notes</th>
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
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p>No expenses found</p>
                </td>
              </tr>
            ) : (
              filtered.map((expense) => (
                <tr key={expense.id} className="hover:bg-stone-50/60">
                  <td className="px-6 py-4 font-medium text-sm text-espresso">{expense.title}</td>
                  <td className="px-6 py-4">
                    <span className="badge bg-primary-50 text-primary-700 text-xs">{expense.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm text-red-600">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 text-sm text-stone-600">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 text-sm text-stone-500 max-w-48 truncate">{expense.notes || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id, expense.title)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-espresso/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-warm w-full max-w-md">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-display font-semibold text-espresso">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select...</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
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
