'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, X, ShoppingCart, CreditCard, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface AddedToCartItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

/**
 * Slide-in confirmation panel shown after adding an item to the cart —
 * offers View Cart / Checkout / Continue Shopping instead of just a toast.
 * Auto-dismisses after a few seconds if the customer doesn't act on it.
 */
export default function AddedToCartPopup({ item, onClose }: { item: AddedToCartItem; onClose: () => void }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(onClose, 7000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const goToCart = () => {
    onClose();
    router.push('/shop/cart');
  };

  const goToCheckout = () => {
    onClose();
    router.push('/shop/cart#payment');
  };

  return (
    <div className="fixed top-24 right-4 sm:right-6 z-[70] w-[calc(100%-2rem)] max-w-sm animate-slide-in-right">
      <div className="bg-white rounded-2xl shadow-warm border border-stone-200/70 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            Added to Cart
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-stone-400 hover:text-espresso hover:bg-stone-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-5 w-5 text-stone-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-espresso truncate">{item.name}</p>
            <p className="text-xs text-espresso/50">
              Qty {item.quantity} · {formatCurrency(item.price)}
            </p>
          </div>
        </div>

        <div className="p-4 pt-1 space-y-2">
          <button
            onClick={goToCheckout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-espresso text-cream text-sm font-semibold hover:bg-primary-800 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Checkout
          </button>
          <button
            onClick={goToCart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-stone-200 text-sm font-medium text-espresso/80 hover:border-primary-300 hover:text-primary-700 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
          </button>
          <button
            onClick={onClose}
            className="w-full py-1.5 text-xs font-medium text-espresso/50 hover:text-espresso transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
