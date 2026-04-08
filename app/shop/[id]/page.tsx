'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCartStore } from '@/lib/cartStore';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, ArrowLeft, Package, Tag, CheckCircle, Truck, Calendar } from 'lucide-react';
import Link from 'next/link';
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
  type: string | null;
  etaStart: string | null;
  etaEnd: string | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const addItem = useCartStore((state) => state.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) {
        router.push('/shop');
        return;
      }
      const data = await res.json();
      setProduct(data);
      setIsLoading(false);
    };
    fetchProduct();
  }, [params.id]);

  const availableStock = product ? product.stock - product.reserved : 0;
  const isPasabuy = product?.type === 'PASABUY';

  const handleAddToCart = () => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!product || (!isPasabuy && availableStock <= 0)) return;
    setShowModal(true);
  };

  const handleConfirm = (quantity: number) => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
      stock: isPasabuy ? 999 : availableStock,
    });
    setAdded(true);
    toast.success(`${product.name} added to cart!`);
    setShowModal(false);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-10 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {showModal && (
        <AddToCartModal
          product={{ name: product.name, price: product.price, availableStock }}
          onConfirm={handleConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/shop" className="hover:text-indigo-600 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <span>{product.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-80 md:h-auto bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-8">
              {isPasabuy && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    Pasabuy Item
                  </div>
                  <p className="text-purple-600 text-xs">We source this on your behalf when you order.</p>
                  {product.etaStart && product.etaEnd ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-purple-200">
                      <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-purple-500 font-medium uppercase tracking-wide">Expected Arrival</p>
                        <p className="text-sm font-semibold text-purple-800">
                          {new Date(product.etaStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          {' – '}
                          {new Date(product.etaEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-purple-400 italic pt-1 border-t border-purple-200">ETA not yet set — contact us for details</p>
                  )}
                </div>
              )}

              {product.category && (
                <div className="flex items-center gap-1 text-indigo-600 text-sm mb-3">
                  <Tag className="h-3 w-3" />
                  <span>{product.category}</span>
                </div>
              )}

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
              )}

              <div className="text-3xl font-bold text-indigo-600 mb-6">
                {formatCurrency(product.price)}
              </div>

              {/* Stock status */}
              <div className="mb-6">
                {isPasabuy ? (
                  <div className="flex items-center gap-2 text-purple-600 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="font-medium">Available to Order</span>
                  </div>
                ) : availableStock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">
                      {availableStock < 5 ? `Only ${availableStock} left in stock` : 'In Stock'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                disabled={!isPasabuy && availableStock <= 0}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  added
                    ? 'bg-green-500 text-white'
                    : isPasabuy
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : availableStock <= 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {isPasabuy ? 'Order Placed!' : 'Added to Cart!'}
                  </>
                ) : (
                  <>
                    {isPasabuy ? <Truck className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                    {isPasabuy ? 'Order Now' : availableStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </>
                )}
              </button>

              {/* Info box */}
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-sm text-indigo-700">
                <p className="font-medium mb-1">Deposit-based reservation</p>
                <p className="text-indigo-600 text-xs">
                  After placing your order, stock will be reserved for 24 hours. You&apos;ll need to submit proof of deposit to confirm your order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
