'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Check, X } from 'lucide-react';

interface ItemTypeRow {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminItemTypesPage() {
  const [itemTypes, setItemTypes] = useState<ItemTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = () =>
    fetch('/api/admin/item-types')
      .then(r => r.json())
      .then(data => { setItemTypes(data); setIsLoading(false); });

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newName.trim()) return;
    setIsAdding(true);
    const res = await fetch('/api/admin/item-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error);
    } else {
      setNewName('');
      setItemTypes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setIsAdding(false);
  };

  const startEdit = (it: ItemTypeRow) => {
    setEditing(it.id);
    setEditName(it.name);
  };

  const cancelEdit = () => setEditing(null);

  const handleSave = async (id: string) => {
    setIsSaving(true);
    const res = await fetch(`/api/admin/item-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItemTypes(prev =>
        prev.map(it => it.id === id ? updated : it).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditing(null);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete item type "${name}"? Products already using this type will keep it, but it will no longer be selectable.`)) return;
    await fetch(`/api/admin/item-types/${id}`, { method: 'DELETE' });
    setItemTypes(prev => prev.filter(it => it.id !== id));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-espresso flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-primary-600" />
          Item Types
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage the item types (Bags, Watches, Eyewear, ...) available when adding or editing a product. Only types
          you add here are selectable — no fixed preset list.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Item Type</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {[1, 2].map(j => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-stone-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : itemTypes.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-stone-400">
                  <LayoutGrid className="h-8 w-8 mx-auto mb-2 text-stone-200" />
                  <p className="text-sm">No item types yet. Add one below.</p>
                </td>
              </tr>
            ) : (
              itemTypes.map(it => (
                <tr key={it.id} className="hover:bg-stone-50/60 group">
                  <td className="px-6 py-3">
                    {editing === it.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full max-w-xs border border-primary-300 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium cursor-pointer"
                        onClick={() => startEdit(it)}
                      >
                        <LayoutGrid className="h-3 w-3" />
                        {it.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === it.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSave(it.id)}
                          disabled={isSaving || !editName.trim()}
                          className="p-1.5 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(it.id, it.name)}
                        className="p-1.5 rounded-xl text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
            <tr className="bg-stone-50/50">
              <td className="px-6 py-3">
                <input
                  type="text"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setAddError(''); }}
                  placeholder="New item type…"
                  className="w-full max-w-xs border border-stone-200 rounded-xl px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  onKeyDown={e => e.key === 'Enter' && handleAdd(e as any)}
                />
                {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newName.trim()}
                  className="flex items-center gap-1 bg-espresso hover:bg-primary-800 text-cream text-xs font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
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
