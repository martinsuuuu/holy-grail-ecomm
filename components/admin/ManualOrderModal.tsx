'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { X, Search, Plus, Minus, Trash2, UserPlus, Users, Package } from 'lucide-react';

interface Customer {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  reserved: number;
  type: string;
  imageUrl: string | null;
}

interface CartLine {
  product: Product;
  quantity: number;
}

export default function ManualOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (order: any) => void;
}) {
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/customers').then(r => r.json()).then(setCustomers).catch(() => {});
    fetch('/api/products?inStockOnly=true').then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.customerId ?? '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [customers, customerSearch]);

  const availableProducts = useMemo(() => {
    return products.filter(p => p.type === 'ONHAND' && (p.stock - p.reserved) > 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    if (!q) return availableProducts.slice(0, 8);
    return availableProducts.filter(p =>
      p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [availableProducts, productSearch]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(l => l.product.id === product.id);
      const available = product.stock - product.reserved;
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map(l => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(l => {
        if (l.product.id !== productId) return l;
        const available = l.product.stock - l.product.reserved;
        const quantity = Math.min(Math.max(l.quantity + delta, 1), available);
        return { ...l, quantity };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(l => l.product.id !== productId));
  };

  const total = cart.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  const handleSubmit = async () => {
    setError('');

    if (customerMode === 'existing' && !selectedCustomerId) {
      setError('Select a customer first.');
      return;
    }
    if (customerMode === 'new' && !newCustomer.name.trim()) {
      setError('Enter the walk-in customer\'s name.');
      return;
    }
    if (cart.length === 0) {
      setError('Add at least one product.');
      return;
    }

    setIsSubmitting(true);

    const res = await fetch('/api/admin/orders/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customerMode === 'existing' ? selectedCustomerId : undefined,
        newCustomer: customerMode === 'new' ? newCustomer : undefined,
        items: cart.map(l => ({ productId: l.product.id, quantity: l.quantity })),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to create order');
      setIsSubmitting(false);
      return;
    }

    onCreated(data);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="fixed inset-0 bg-espresso/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-warm w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-display font-semibold text-espresso">Create Manual Order</h2>
            <p className="text-xs text-stone-500 mt-0.5">For a walk-in customer paying in-store</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

          {/* Customer */}
          <div>
            <label className="label mb-2">Customer</label>
            <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-3 w-fit">
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  customerMode === 'existing' ? 'bg-white text-espresso shadow-sm' : 'text-stone-500 hover:text-espresso'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  customerMode === 'new' ? 'bg-white text-espresso shadow-sm' : 'text-stone-500 hover:text-espresso'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" /> New Walk-in
              </button>
            </div>

            {customerMode === 'existing' ? (
              <div>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-espresso">{selectedCustomer.name}</p>
                      <p className="text-xs text-stone-500">{selectedCustomer.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(null)}
                      className="text-xs text-primary-700 hover:text-primary-900 font-medium"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or customer ID..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-10 input-field"
                      />
                    </div>
                    <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-40 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-xs text-stone-400 text-center py-4">No customers found</p>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="w-full text-left px-3 py-2 hover:bg-stone-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-espresso">{c.name}</p>
                            <p className="text-xs text-stone-500">{c.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Customer name *"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(c => ({ ...c, name: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer(c => ({ ...c, email: e.target.value }))}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* Products */}
          <div>
            <label className="label mb-2">Add Products (from available stock)</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-40 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">No in-stock products found</p>
              ) : (
                filteredProducts.map(p => {
                  const available = p.stock - p.reserved;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-3.5 w-3.5 text-stone-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-espresso truncate">{p.name}</p>
                          <p className="text-xs text-stone-400">{available} available{p.sku ? ` · ${p.sku}` : ''}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-espresso flex-shrink-0 ml-2">{formatCurrency(p.price)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div>
              <label className="label mb-2">Order Items</label>
              <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
                {cart.map(l => (
                  <div key={l.product.id} className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0 mr-2">
                      <p className="text-sm text-espresso truncate">{l.product.name}</p>
                      <p className="text-xs text-stone-400">{formatCurrency(l.product.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button" onClick={() => updateQuantity(l.product.id, -1)} className="p-1 rounded-lg border border-stone-200 hover:border-primary-300 text-stone-500">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm w-5 text-center">{l.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(l.product.id, 1)} className="p-1 rounded-lg border border-stone-200 hover:border-primary-300 text-stone-500">
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold text-espresso w-20 text-right">{formatCurrency(l.product.price * l.quantity)}</span>
                      <button type="button" onClick={() => removeFromCart(l.product.id)} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-sm text-stone-500">Total</span>
                <span className="text-lg font-bold text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-stone-100 flex gap-3">
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
