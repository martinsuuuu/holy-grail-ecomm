'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Trash2, Upload, Building2, Smartphone, X, ToggleLeft, ToggleRight, AlertTriangle, Save, Check } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  accountName: string | null;
  accountNumber: string | null;
  qrCode: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface EditState {
  accountName: string;
  accountNumber: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'GCASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetch_ = () =>
    fetch('/api/admin/payment-methods')
      .then(r => r.json())
      .then(data => {
        setMethods(data);
        setIsLoading(false);
        // Initialise edit state from fetched data
        const initEdits: Record<string, EditState> = {};
        for (const m of data) {
          initEdits[m.id] = { accountName: m.accountName ?? '', accountNumber: m.accountNumber ?? '' };
        }
        setEdits(initEdits);
      });

  useEffect(() => { fetch_(); }, []);

  const gcash = methods.filter(m => m.type === 'GCASH');
  const banks = methods.filter(m => m.type === 'BANK_TRANSFER');

  const handleAdd = async () => {
    setAddError('');
    if (!addName.trim()) { setAddError('Name is required'); return; }
    const res = await fetch('/api/admin/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: addType, name: addName }),
    });
    if (!res.ok) { const d = await res.json(); setAddError(d.error); return; }
    setShowAddModal(false);
    setAddName('');
    fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    await fetch(`/api/admin/payment-methods/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const handleToggle = async (m: PaymentMethod) => {
    await fetch(`/api/admin/payment-methods/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    fetch_();
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await Promise.all(
      Object.entries(edits).map(([id, edit]) =>
        fetch(`/api/admin/payment-methods/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountName: edit.accountName, accountNumber: edit.accountNumber }),
        })
      )
    );
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetch_();
  };

  const handleQrUpload = async (id: string, file: File) => {
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    setUploading(id);
    const reader = new FileReader();
    reader.onload = async e => {
      const base64 = e.target?.result as string;
      await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: base64 }),
      });
      setUploading(null);
      fetch_();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = async (id: string) => {
    await fetch(`/api/admin/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: null }),
    });
    fetch_();
  };

  const updateEdit = (id: string, field: keyof EditState, value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const MethodCard = ({ m }: { m: PaymentMethod }) => (
    <div className={`border rounded-xl p-4 ${m.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {m.type === 'GCASH'
            ? <Smartphone className="h-4 w-4 text-blue-500 flex-shrink-0" />
            : <Building2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />}
          <span className="font-medium text-gray-900 truncate">{m.name}</span>
          {!m.isActive && <span className="text-xs text-gray-400 flex-shrink-0">(hidden)</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleToggle(m)}
            title={m.isActive ? 'Hide from customers' : 'Show to customers'}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            {m.isActive
              ? <ToggleRight className="h-4 w-4 text-green-500" />
              : <ToggleLeft className="h-4 w-4 text-gray-400" />}
          </button>
          <button
            onClick={() => handleDelete(m.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Account details */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Account Name</label>
          <input
            type="text"
            value={edits[m.id]?.accountName ?? ''}
            onChange={e => updateEdit(m.id, 'accountName', e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Account Number</label>
          <input
            type="text"
            value={edits[m.id]?.accountNumber ?? ''}
            onChange={e => updateEdit(m.id, 'accountNumber', e.target.value)}
            placeholder="e.g. 09XX XXX XXXX"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* No QR warning */}
      {!m.qrCode && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-700 font-medium">Not visible to customers — upload a QR code</span>
        </div>
      )}

      {/* QR Code */}
      <div>
        {m.qrCode ? (
          <div className="relative inline-block">
            <img src={m.qrCode} alt="QR Code" className="w-32 h-32 object-contain border border-gray-200 rounded-lg" />
            <button
              onClick={() => handleRemoveQr(m.id)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRefs.current[m.id]?.click()}
            className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
          >
            {uploading === m.id ? (
              <div className="text-xs text-gray-400">Uploading…</div>
            ) : (
              <>
                <Upload className="h-5 w-5 text-gray-300 mb-1" />
                <span className="text-xs text-gray-400 text-center px-1">Upload QR / Image</span>
              </>
            )}
          </div>
        )}
        <input
          ref={el => { fileInputRefs.current[m.id] = el; }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleQrUpload(m.id, f); e.target.value = ''; }}
        />
        {m.qrCode && (
          <button
            onClick={() => fileInputRefs.current[m.id]?.click()}
            className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Upload className="h-3 w-3" /> Replace image
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-indigo-600" />
            Payment Methods
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage payment options shown to customers at checkout</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || methods.length === 0}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              saved
                ? 'bg-green-100 text-green-700'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button
            onClick={() => { setShowAddModal(true); setAddError(''); setAddName(''); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* GCash */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">GCash</h2>
              <span className="text-xs text-gray-400">({gcash.length} configured)</span>
            </div>
            {gcash.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                No GCash entry yet.{' '}
                <button
                  onClick={() => { setAddType('GCASH'); setAddName('GCash'); setShowAddModal(true); }}
                  className="text-indigo-600 hover:underline"
                >
                  Add one
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gcash.map(m => <MethodCard key={m.id} m={m} />)}
              </div>
            )}
          </div>

          {/* Bank Transfer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Bank Transfer</h2>
              <span className="text-xs text-gray-400">({banks.length} banks)</span>
            </div>
            {banks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                No banks configured.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {banks.map(m => <MethodCard key={m.id} m={m} />)}
              </div>
            )}
            <button
              onClick={() => { setAddType('BANK_TRANSFER'); setAddName(''); setShowAddModal(true); }}
              className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="h-4 w-4" /> Add bank
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Payment Method</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['GCASH', 'BANK_TRANSFER'] as const).map(t => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer text-sm transition-all ${
                        addType === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <input type="radio" name="type" value={t} checked={addType === t} onChange={() => setAddType(t)} className="hidden" />
                      {t === 'GCASH' ? <Smartphone className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      {t === 'GCASH' ? 'GCash' : 'Bank Transfer'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  {addType === 'GCASH' ? 'Name (e.g. GCash)' : 'Bank Name (e.g. UnionBank)'}
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder={addType === 'GCASH' ? 'GCash' : 'e.g. UnionBank, Metrobank'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
