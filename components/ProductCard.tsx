'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, Truck, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/lib/cartStore';
import { useSession } from 'next-auth/react';
import { toast } from '@/lib/toast';
import AddToCartModal from '@/components/AddToCartModal';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  reserved: number;
  category: string | null;
  imageUrl: string | null;
  type?: string | null;
  etaStart?: string | null;
  etaEnd?: string | null;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const availableStock = product.stock - product.reserved;
  const isPasabuy = product.type === 'PASABUY';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      window.location.href = '/login';
      return;
    }
    if (availableStock <= 0 && !isPasabuy) return;
    setShowModal(true);
  };

  const handleConfirm = (quantity: number) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
      stock: isPasabuy ? 999 : availableStock,
    });
    toast.success(`${product.name} added to cart!`);
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <AddToCartModal
          product={{ name: product.name, price: product.price, availableStock: isPasabuy ? 999 : availableStock }}
          onConfirm={handleConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
      <Link href={`/shop/${product.id}`} className="group flex h-full">
        <div className={`flex flex-col w-full bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-200 ${
          isPasabuy ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200'
        }`}>
          {/* Pasabuy banner */}
          {isPasabuy && (
            <div className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1.5">
              <Truck className="h-3 w-3" />
              Pasabuy Item
            </div>
          )}

          {/* Product Image */}
          <div className="relative h-48 flex-shrink-0 bg-gray-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            )}
            {product.category && (
              <span className="absolute top-2 left-2 bg-white/90 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {product.category}
              </span>
            )}
            {!isPasabuy && availableStock <= 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">Out of Stock</span>
              </div>
            )}
            {!isPasabuy && availableStock > 0 && availableStock < 5 && (
              <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Only {availableStock} left!
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col flex-1 p-4">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
            {isPasabuy && product.etaStart && product.etaEnd && (
              <div className="flex items-center gap-1 mt-1.5 text-purple-600 text-xs">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>
                  {new Date(product.etaStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(product.etaEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="text-sm font-semibold text-indigo-600">{formatCurrency(product.price)}</span>
              <button
                onClick={handleAddToCart}
                disabled={!isPasabuy && availableStock <= 0}
                className={`flex items-center gap-1 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  isPasabuy
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : availableStock <= 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <ShoppingCart className="h-3 w-3" />
                {isPasabuy ? 'Order' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
