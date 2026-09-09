'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Truck, Save } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
}

interface LineItem {
  productId: string;
  quantity: string;
  unitCost: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { productId: '', quantity: '1', unitCost: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  const addItem = () => {
    setItems([...items, { productId: '', quantity: '1', unitCost: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill unit cost from product price
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].unitCost = product.price.toString();
      }
    }

    setItems(updated);
  };

  const totalCost = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    return sum + (qty * cost);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supplier.trim()) {
      setError('Supplier name is required');
      return;
    }

    const validItems = items.filter(item => item.productId && item.quantity && item.unitCost);
    if (validItems.length === 0) {
      setError('At least one item is required');
      return;
    }

    setIsLoading(true);

    const res = await fetch('/api/admin/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplier, items: validItems }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to create purchase order');
    } else {
      router.push('/admin/purchase-orders');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/purchase-orders" className="text-stone-500 hover:text-primary-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">New Purchase Order</h1>
          <p className="text-stone-500 text-sm mt-1">Order products from a supplier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm mb-6">{error}</div>
        )}

        {/* Supplier */}
        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 mb-6">
          <h2 className="font-display font-semibold text-espresso mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary-600" />
            Supplier Information
          </h2>
          <div>
            <label className="label">Supplier Name *</label>
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. ABC Electronics Co."
              className="input-field"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-espresso">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary text-sm flex items-center gap-1 py-1.5"
            >
              <Plus className="h-3 w-3" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left pb-3 text-xs font-medium text-stone-500 uppercase">Product</th>
                  <th className="text-right pb-3 text-xs font-medium text-stone-500 uppercase w-24">Quantity</th>
                  <th className="text-right pb-3 text-xs font-medium text-stone-500 uppercase w-32">Unit Cost</th>
                  <th className="text-right pb-3 text-xs font-medium text-stone-500 uppercase w-28">Subtotal</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
                  return (
                    <tr key={index} className="border-b border-stone-50">
                      <td className="py-3 pr-3">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="input-field py-2"
                        >
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="input-field py-2 text-right"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                          className="input-field py-2 text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-3 pl-2 text-right font-medium text-espresso">
                        {formatCurrency(subtotal)}
                      </td>
                      <td className="py-3 pl-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-4 pr-2 text-right font-semibold text-stone-700">
                    Total Cost:
                  </td>
                  <td className="pt-4 pl-2 text-right font-bold text-xl text-primary-700">
                    {formatCurrency(totalCost)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Creating...' : 'Create Purchase Order'}
          </button>
          <Link href="/admin/purchase-orders" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
