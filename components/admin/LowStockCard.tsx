'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  category: string | null;
}

const VISIBLE_COUNT = 5;

export default function LowStockCard({ products }: { products: LowStockProduct[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? products : products.slice(0, VISIBLE_COUNT);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70">
      <div className="flex items-center justify-between p-4 border-b border-stone-100">
        <h2 className="font-display font-semibold text-espresso flex items-center gap-2">
          <Package className="h-4 w-4 text-red-500" />
          Low Stock
        </h2>
        <a href="/admin/products" className="text-xs text-primary-600 hover:text-primary-800">
          Manage
        </a>
      </div>
      {products.length === 0 ? (
        <div className="p-4 text-sm text-stone-500 text-center">All products well stocked!</div>
      ) : (
        <>
          <div className="divide-y divide-stone-50">
            {visible.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-espresso truncate max-w-32">{product.name}</p>
                  <p className="text-xs text-stone-400">{product.category}</p>
                </div>
                <span className={`badge text-xs ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {product.stock} left
                </span>
              </div>
            ))}
          </div>
          {products.length > VISIBLE_COUNT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full py-2.5 text-xs font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50/60 border-t border-stone-100 transition-colors"
            >
              {showAll ? 'Show Less' : `See All (${products.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
