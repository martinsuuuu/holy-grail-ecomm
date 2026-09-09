'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AddToCartModalProps {
  product: {
    name: string;
    price: number;
    availableStock: number;
  };
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

export default function AddToCartModal({ product, onConfirm, onClose }: AddToCartModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isValid = quantity >= 1 && quantity <= product.availableStock;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-warm w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-espresso leading-snug">{product.name}</h2>
            <p className="text-primary-700 font-bold text-xl mt-1">{formatCurrency(product.price)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-espresso hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stock info */}
        <p className="text-xs text-espresso/50 mb-4">
          {product.availableStock} unit{product.availableStock !== 1 ? 's' : ''} available
        </p>

        {/* Quantity selector */}
        <div className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3 mb-6">
          <span className="text-sm font-medium text-espresso/80">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-lg font-semibold text-espresso">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.availableStock, q + 1))}
              disabled={quantity >= product.availableStock}
              className="w-8 h-8 flex items-center justify-center bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm text-espresso/60 mb-6">
          <span>Subtotal</span>
          <span className="font-semibold text-espresso">{formatCurrency(product.price * quantity)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-stone-200 text-espresso/80 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (isValid) onConfirm(quantity); }}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-espresso hover:bg-primary-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
