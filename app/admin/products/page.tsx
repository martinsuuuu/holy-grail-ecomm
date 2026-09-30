'use client';

import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Upload, X, ShoppingBag, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEM_TYPES } from '@/lib/productTypes';

type ProductType = 'ONHAND' | 'PASABUY';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  reserved: number;
  category: string | null;
  itemType: string | null;
  imageUrl: string | null;
  type: ProductType;
  etaStart: string | null;
  etaEnd: string | null;
  createdAt: string;
  model: string | null;
  subcategory: string | null;
  color: string | null;
  dimension: string | null;
  size: string | null;
  hardware: string | null;
  stamp: string | null;
  authenticated: boolean;
  costPrice: number | null;
  inclusions: string | null;
}

const TYPE_META: Record<ProductType, { label: string; color: string; bg: string; dot: string }> = {
  ONHAND: {
    label: 'On Hand',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  PASABUY: {
    label: 'Personal Shopping',
    color: 'text-plum-700',
    bg: 'bg-plum-100',
    dot: 'bg-plum-500',
  },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalStep, setModalStep] = useState<'closed' | 'type' | 'form'>('closed');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedType, setSelectedType] = useState<ProductType>('ONHAND');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    itemType: '',
    imageUrl: '',
    etaStart: '',
    etaEnd: '',
    model: '',
    subcategory: '',
    color: '',
    dimension: '',
    size: '',
    hardware: '',
    stamp: '',
    authenticated: false,
    costPrice: '',
    inclusions: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const scrollTable = (dir: -1 | 1) => tableScrollRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(data => setCategories(data.map((c: { name: string }) => c.name)));
  }, []);

  const fetchProducts = async () => {
    const params = search ? `?search=${search}` : '';
    const res = await fetch(`/api/products${params}`);
    const data = await res.json();
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setFormData(prev => ({ ...prev, imageUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const toDateInput = (iso: string | null) => {
    if (!iso) return '';
    return iso.slice(0, 10); // 'YYYY-MM-DD'
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setSelectedType('ONHAND');
    setFormData({
      name: '', description: '', price: '', stock: '', category: '', itemType: '', imageUrl: '', etaStart: '', etaEnd: '',
      model: '', subcategory: '', color: '', dimension: '', size: '', hardware: '', stamp: '', authenticated: false, costPrice: '', inclusions: '',
    });
    setError('');
    setModalStep('type');
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setSelectedType(product.type ?? 'ONHAND');
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      itemType: product.itemType || '',
      imageUrl: product.imageUrl || '',
      etaStart: toDateInput(product.etaStart),
      etaEnd: toDateInput(product.etaEnd),
      model: product.model || '',
      subcategory: product.subcategory || '',
      color: product.color || '',
      dimension: product.dimension || '',
      size: product.size || '',
      hardware: product.hardware || '',
      stamp: product.stamp || '',
      authenticated: Boolean(product.authenticated),
      costPrice: product.costPrice != null ? product.costPrice.toString() : '',
      inclusions: product.inclusions || '',
    });
    setError('');
    setModalStep('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, type: selectedType }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to save product');
    } else {
      setModalStep('closed');
      fetchProducts();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Products</h1>
          <p className="text-stone-500 text-sm mt-1">{products.length} products total</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Products Table — wide, with every inventory detail field as its own
          column. Scroll horizontally (or use the arrows) to see them all. */}
      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="text-xs text-stone-400">Scroll sideways to see all product details</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollTable(-1)}
              aria-label="Scroll table left"
              className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:border-primary-300 hover:text-primary-700 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scrollTable(1)}
              aria-label="Scroll table right"
              className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:border-primary-300 hover:text-primary-700 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div ref={tableScrollRef} className="overflow-x-auto">
        <table className="w-full min-w-[2100px]">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Product</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Brand</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Item Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Model</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Subcategory</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Color</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Size</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Dimension</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Leather / Hardware</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Stamp</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Authenticated</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">SRP</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Cost</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Stock / ETA</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase whitespace-nowrap">Inclusions</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 17 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-stone-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-6 py-12 text-center text-stone-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                  <p>No products found</p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const typeMeta = TYPE_META[product.type ?? 'ONHAND'];
                return (
                  <tr key={product.id} className="hover:bg-stone-50/60 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-stone-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-espresso text-sm whitespace-nowrap">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-stone-500 truncate max-w-40">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${typeMeta.bg} ${typeMeta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dot}`} />
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.itemType || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.model || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.subcategory || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.color || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.size || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.dimension || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.hardware || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.stamp || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        product.authenticated ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.authenticated ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        {product.authenticated ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-sm text-espresso whitespace-nowrap">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.costPrice != null ? formatCurrency(product.costPrice) : '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {product.type === 'PASABUY' ? (
                        <div className="text-xs text-plum-700 space-y-0.5 whitespace-nowrap">
                          {product.etaStart && product.etaEnd ? (
                            <>
                              <p className="font-medium">
                                {new Date(product.etaStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' – '}
                                {new Date(product.etaEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </>
                          ) : (
                            <span className="text-stone-400 italic">No ETA set</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`badge text-xs ${
                            product.stock === 0
                              ? 'bg-red-100 text-red-700'
                              : product.stock < 5
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {product.stock} in stock
                          </span>
                          {product.reserved > 0 && (
                            <span className="text-xs text-stone-400">({product.reserved} reserved)</span>
                          )}
                          {product.stock < 5 && product.stock > 0 && (
                            <AlertTriangle className="h-3 w-3 text-orange-400" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 whitespace-nowrap">{product.inclusions || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Step 1 — Type Picker Modal */}
      {modalStep === 'type' && (
        <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-warm w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-stone-100">
              <h2 className="text-lg font-display font-semibold text-espresso">Add New Product</h2>
              <p className="text-sm text-stone-500 mt-1">First, choose the product type</p>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto">
              <button
                onClick={() => { setSelectedType('ONHAND'); setModalStep('form'); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl transition-all text-left group"
              >
                <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <ShoppingBag className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-espresso">On Hand</p>
                  <p className="text-sm text-stone-500 mt-0.5">Product is physically in stock and ready to ship</p>
                </div>
              </button>

              <button
                onClick={() => { setSelectedType('PASABUY'); setModalStep('form'); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-stone-200 hover:border-plum-400 hover:bg-plum-50 rounded-xl transition-all text-left group"
              >
                <div className="w-12 h-12 bg-plum-100 group-hover:bg-plum-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Truck className="h-6 w-6 text-plum-600" />
                </div>
                <div>
                  <p className="font-semibold text-espresso">Personal Shopping</p>
                  <p className="text-sm text-stone-500 mt-0.5">Product sourced on request — order before we buy</p>
                </div>
              </button>
            </div>
            <div className="px-6 pb-6 flex-shrink-0">
              <button
                onClick={() => setModalStep('closed')}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Product Form Modal */}
      {modalStep === 'form' && (
        <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-warm w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedType === 'PASABUY' ? 'bg-plum-100' : 'bg-emerald-100'
                }`}>
                  {selectedType === 'PASABUY'
                    ? <Truck className="h-4 w-4 text-plum-600" />
                    : <ShoppingBag className="h-4 w-4 text-emerald-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-espresso">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className={`text-xs font-medium ${selectedType === 'PASABUY' ? 'text-plum-600' : 'text-emerald-600'}`}>
                    {TYPE_META[selectedType].label}
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              {/* Type toggle (visible when editing) */}
              {editingProduct && (
                <div>
                  <label className="label">Product Type</label>
                  <div className="flex gap-2">
                    {(['ONHAND', 'PASABUY'] as ProductType[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedType(t)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedType === t
                            ? t === 'PASABUY'
                              ? 'border-plum-400 bg-plum-50 text-plum-700'
                              : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-stone-200 text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        {t === 'PASABUY' ? <Truck className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                        {TYPE_META[t].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">SRP (Selling Price) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Brand</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select brand</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Item Type</label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select type</option>
                    {ITEM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inventory details — from the master inventory sheet */}
              <div className="pt-3 border-t border-stone-100 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Inventory Details</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Subcategory</label>
                    <input
                      type="text"
                      placeholder="e.g. Flap Bag, Tote Bag"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Size</label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Dimension</label>
                  <input
                    type="text"
                    placeholder="e.g. L - 12cm, H - 13cm, W - 8cm"
                    value={formData.dimension}
                    onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Leather / Hardware</label>
                  <input
                    type="text"
                    value={formData.hardware}
                    onChange={(e) => setFormData({ ...formData, hardware: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Stamp</label>
                    <input
                      type="text"
                      placeholder="serial / date code"
                      value={formData.stamp}
                      onChange={(e) => setFormData({ ...formData, stamp: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="internal only"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Inclusions</label>
                  <input
                    type="text"
                    placeholder="e.g. Box & Dust Bag, Authenticity Card"
                    value={formData.inclusions}
                    onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                    className="input-field"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.authenticated}
                    onChange={(e) => setFormData({ ...formData, authenticated: e.target.checked })}
                    className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-espresso/70">Entrupy / authentication verified</span>
                </label>
              </div>

              {/* ETA — Pasabuy only */}
              {selectedType === 'PASABUY' && (
                <div className="bg-plum-50 border border-plum-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-plum-700 text-sm font-semibold">
                    <Truck className="h-4 w-4" />
                    Expected Time of Arrival (ETA)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-plum-700">ETA From</label>
                      <input
                        type="date"
                        value={formData.etaStart}
                        onChange={(e) => setFormData({ ...formData, etaStart: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label text-plum-700">ETA To</label>
                      <input
                        type="date"
                        value={formData.etaEnd}
                        min={formData.etaStart || undefined}
                        onChange={(e) => setFormData({ ...formData, etaEnd: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  {formData.etaStart && formData.etaEnd && (
                    <p className="text-xs text-plum-600">
                      Customers will see: arriving{' '}
                      <span className="font-medium">
                        {new Date(formData.etaStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(formData.etaEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Product Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
                />
                {formData.imageUrl ? (
                  <div className="relative inline-block w-full">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-xl border border-stone-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800"
                    >
                      <Upload className="h-3 w-3" /> Replace image
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleImageUpload(f); }}
                    className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all"
                  >
                    <Upload className="h-6 w-6 text-stone-300 mb-2" />
                    <p className="text-sm text-stone-400">Click or drag & drop to upload</p>
                    <p className="text-xs text-stone-300 mt-1">PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
              </div>
              <div className="flex gap-3 p-6 pt-4 border-t border-stone-100 flex-shrink-0">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalStep('closed')}
                  className="btn-secondary flex-1"
                >
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
