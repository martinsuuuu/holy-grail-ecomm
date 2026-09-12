'use client';

import { create } from 'zustand';

interface WishlistProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  stock: number;
  reserved: number;
  type?: string | null;
}

interface WishlistEntry {
  id: string;
  productId: string;
  product: WishlistProduct;
}

interface WishlistStore {
  items: WishlistEntry[];
  loaded: boolean;
  fetchWishlist: () => Promise<void>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loaded: false,
  fetchWishlist: async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (!res.ok) return;
      const data = await res.json();
      set({ items: data, loaded: true });
    } catch {
      // ignore
    }
  },
  has: (productId) => get().items.some((item) => item.productId === productId),
  toggle: async (productId) => {
    const already = get().has(productId);
    if (already) {
      await get().remove(productId);
      return;
    }
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      await get().fetchWishlist();
    }
  },
  remove: async (productId) => {
    set((state) => ({ items: state.items.filter((item) => item.productId !== productId) }));
    await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
  },
}));
