'use client';

import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/lib/cartStore';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  stock: number;
}

export default function CartItem({ id, name, price, quantity, imageUrl, stock }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-4 py-4 border-b border-stone-100 last:border-0">
      <div className="w-16 h-16 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-6 w-6 text-stone-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-espresso truncate">{name}</h4>
        <p className="text-sm font-bold text-primary-700 mt-0.5">{formatCurrency(price)}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(id, quantity - 1)}
          className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <button
          onClick={() => updateQuantity(id, quantity + 1)}
          disabled={quantity >= stock}
          className="w-7 h-7 flex items-center justify-center bg-stone-100 hover:bg-stone-200 disabled:opacity-50 rounded-full transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="w-20 text-right">
        <p className="text-sm font-semibold text-espresso">{formatCurrency(price * quantity)}</p>
      </div>

      <button
        onClick={() => removeItem(id)}
        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
