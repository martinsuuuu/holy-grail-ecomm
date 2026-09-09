'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCartStore } from '@/lib/cartStore';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { MessageCircle, ArrowLeft, Package, Tag, CheckCircle, Truck, Calendar } from 'lucide-react';
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
    toast.success(isPasabuy ? `${product.name} order placed!` : `Request sent — our team will reach out to confirm ${product.name}.`);
    setShowModal(false);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-stone-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-stone-200 rounded w-3/4" />
              <div className="h-4 bg-stone-200 rounded" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
              <div className="h-10 bg-stone-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-cream">
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
        <div className="flex items-center gap-2 text-sm text-espresso/50 mb-6">
          <Link href="/shop" className="hover:text-primary-700 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <span>{product.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-espresso font-medium truncate">{product.name}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-80 md:h-auto bg-stone-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-stone-300" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-8">
              {isPasabuy && (
                <div className="bg-plum-50 border border-plum-200 rounded-2xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-plum-700 font-semibold text-sm">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    Pasabuy Item
                  </div>
                  <p className="text-plum-600 text-xs">We source this on your behalf when you order.</p>
                  {product.etaStart && product.etaEnd ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-plum-200">
                      <Calendar className="h-4 w-4 text-plum-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-plum-500 font-medium uppercase tracking-wide">Expected Arrival</p>
                        <p className="text-sm font-semibold text-plum-800">
                          {new Date(product.etaStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          {' – '}
                          {new Date(product.etaEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-plum-400 italic pt-1 border-t border-plum-200">ETA not yet set — contact us for details</p>
                  )}
                </div>
              )}

              {product.category && (
                <div className="flex items-center gap-1 text-primary-700 text-sm mb-3">
                  <Tag className="h-3 w-3" />
                  <span>{product.category}</span>
                </div>
              )}

              <h1 className="text-2xl font-display font-black text-espresso mb-4">{product.name}</h1>

              {product.description && (
                <p className="text-espresso/70 mb-6 leading-relaxed">{product.description}</p>
              )}

              <div className="text-lg font-medium text-espresso/60 mb-6">
                {formatCurrency(product.price)}
              </div>

              {/* Stock status */}
              <div className="mb-6">
                {isPasabuy ? (
                  <div className="flex items-center gap-2 text-plum-600 text-sm">
                    <div className="w-2 h-2 bg-plum-500 rounded-full" />
                    <span className="font-medium">Available to Order</span>
                  </div>
                ) : availableStock > 0 ? (
                  <div className="flex items-center gap-2 text-emerald-700 text-sm">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                    <span className="font-medium">
                      {availableStock < 5 ? `Only ${availableStock} left in stock` : 'In Stock'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <button
                onClick={handleAddToCart}
                disabled={!isPasabuy && availableStock <= 0}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold tracking-wide transition-all duration-200 ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : isPasabuy
                    ? 'bg-plum-600 hover:bg-plum-700 text-white'
                    : availableStock <= 0
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-espresso hover:bg-primary-800 text-white'
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {isPasabuy ? 'Order Placed!' : 'Request Sent!'}
                  </>
                ) : (
                  <>
                    {isPasabuy ? <Truck className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                    {isPasabuy ? 'Order Now' : availableStock <= 0 ? 'Out of Stock' : 'Contact Sales Associate'}
                  </>
                )}
              </button>

              {/* Info box */}
              <div className="mt-6 p-4 bg-primary-50 rounded-2xl text-sm text-primary-800">
                <p className="font-medium mb-1">Deposit-based reservation</p>
                <p className="text-primary-700 text-xs">
                  After placing your order, stock will be reserved for 24 hours. You&apos;ll need to submit proof of deposit to confirm your order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
