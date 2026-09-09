import Link from 'next/link';
import { Package, Truck, Calendar } from 'lucide-react';

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
  const availableStock = product.stock - product.reserved;
  const isPasabuy = product.type === 'PASABUY';

  return (
    <Link href={`/shop/${product.id}`} className="group flex flex-col h-full w-full">
      {/* Pasabuy banner */}
      {isPasabuy && (
        <div className="flex items-center gap-1.5 bg-plum-600 text-white text-xs font-semibold px-3 py-1.5 tracking-wide">
          <Truck className="h-3 w-3" />
          Pasabuy Item
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square flex-shrink-0 bg-stone-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover grayscale-[0.15] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-stone-300" />
          </div>
        )}
        {!isPasabuy && availableStock <= 0 && (
          <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm font-medium px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        {!isPasabuy && availableStock > 0 && availableStock < 5 && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            Only {availableStock} left!
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 pt-3">
        {product.category && (
          <span className="text-[11px] uppercase tracking-widest text-espresso/40 mb-1">{product.category}</span>
        )}
        <h3 className="font-medium text-espresso text-sm leading-snug line-clamp-2 group-hover:text-espresso/60 transition-colors">
          {product.name}
        </h3>
        {isPasabuy && product.etaStart && product.etaEnd && (
          <div className="flex items-center gap-1 mt-1.5 text-plum-600 text-xs">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>
              {new Date(product.etaStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(product.etaEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
