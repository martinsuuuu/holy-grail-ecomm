'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface EditState {
  name: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const load = () =>
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(data => { setCategories(data); setIsLoading(false); });

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newName.trim()) return;
    setIsAdding(true);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error);
    } else {
      setNewName('');
      setNewDescription('');
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setIsAdding(false);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat.id);
    setEditState({ name: cat.name, description: cat.description ?? '' });
  };

  const cancelEdit = () => setEditing(null);

  const handleSave = async (id: string) => {
    setIsSaving(true);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editState.name, description: editState.description }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories(prev =>
        prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditing(null);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products using this category will not be affected.`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="h-6 w-6 text-indigo-600" />
          Product Categories
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage categories used to organize products</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase w-48">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {[1, 2, 3].map(j => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No categories yet. Add one below.</p>
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-3">
                    {editing === cat.id ? (
                      <input
                        type="text"
                        value={editState.name}
                        onChange={e => setEditState(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-indigo-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium cursor-pointer"
                        onClick={() => startEdit(cat)}
                      >
                        <Tag className="h-3 w-3" />
                        {cat.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {editing === cat.id ? (
                      <input
                        type="text"
                        value={editState.description}
                        onChange={e => setEditState(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add a description…"
                        className="w-full border border-indigo-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : (
                      <span
                        className="text-sm text-gray-500 cursor-pointer"
                        onClick={() => startEdit(cat)}
                      >
                        {cat.description || <span className="text-gray-300 italic">No description</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSave(cat.id)}
                          disabled={isSaving || !editState.name.trim()}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}

            {/* Add new row */}
            <tr className="bg-gray-50/50">
              <td className="px-6 py-3">
                <input
                  type="text"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setAddError(''); }}
                  placeholder="New category…"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  onKeyDown={e => e.key === 'Enter' && handleAdd(e as any)}
                />
                {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
              </td>
              <td className="px-6 py-3">
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  onKeyDown={e => e.key === 'Enter' && handleAdd(e as any)}
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newName.trim()}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
