'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useCartStore } from '@/lib/cartStore';
import { useWishlistStore } from '@/lib/wishlistStore';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, ArrowLeft, Package, Tag, CheckCircle, Truck, Calendar, Heart, ShieldCheck, ZoomIn } from 'lucide-react';
import Link from 'next/link';
import AddToCartModal from '@/components/AddToCartModal';
import AddedToCartPopup, { AddedToCartItem } from '@/components/AddedToCartPopup';
import ProductImageLightbox from '@/components/ProductImageLightbox';

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
  model: string | null;
  subcategory: string | null;
  color: string | null;
  dimension: string | null;
  size: string | null;
  hardware: string | null;
  stamp: string | null;
  authenticated: boolean;
  inclusions: string | null;
  images?: { id: string; url: string }[];
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
  const [cartPopupItem, setCartPopupItem] = useState<AddedToCartItem | null>(null);
  const closeCartPopup = useCallback(() => setCartPopupItem(null), []);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isWishlisted = useWishlistStore((state) => state.has(product?.id ?? ''));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  // Main photo first, then any gallery photos — browsable together as one
  // thumbnail strip. Listing/grid views elsewhere only ever show imageUrl.
  const galleryImages = product
    ? [product.imageUrl, ...(product.images || []).map((img) => img.url)].filter(Boolean) as string[]
    : [];

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) {
        router.push('/shop');
        return;
      }
      const data = await res.json();
      setProduct(data);
      setActiveImageIndex(0);
      setIsLoading(false);
    };
    fetchProduct();
  }, [params.id]);

  useEffect(() => {
    if (!product?.category) {
      setRelatedProducts([]);
      return;
    }
    fetch(`/api/products?category=${encodeURIComponent(product.category)}`)
      .then((r) => r.json())
      .then((data: Product[]) => setRelatedProducts(data.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => setRelatedProducts([]));
  }, [product?.category, product?.id]);

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

  const handleWishlist = () => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!product) return;
    toggleWishlist(product.id);
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
    setCartPopupItem({ name: product.name, price: product.price, quantity, imageUrl: product.imageUrl });
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
          product={{ name: product.name, price: product.price, availableStock: isPasabuy ? 999 : availableStock }}
          onConfirm={handleConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
      {cartPopupItem && (
        <AddedToCartPopup item={cartPopupItem} onClose={closeCartPopup} />
      )}
      {lightboxOpen && galleryImages.length > 0 && (
        <ProductImageLightbox
          images={galleryImages}
          index={activeImageIndex}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setActiveImageIndex}
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
            {/* Image gallery — vertical thumbnail rail on the left, main photo on the right */}
            <div className="flex gap-3 p-3">
              {galleryImages.length > 1 && (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-80 md:max-h-[520px] flex-shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      aria-label={`View photo ${i + 1}`}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === activeImageIndex ? 'border-primary-600' : 'border-transparent hover:border-stone-300'
                      }`}
                    >
                      <img src={img} alt={`${product.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex-1 h-80 md:h-auto md:aspect-square rounded-xl overflow-hidden bg-stone-100">
                {galleryImages.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="group relative block w-full h-full cursor-zoom-in"
                    aria-label="View full-size image"
                  >
                    <img
                      src={galleryImages[activeImageIndex] || galleryImages[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-espresso/60 text-cream text-xs px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-3.5 w-3.5" />
                      View full size
                    </span>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-20 w-20 text-stone-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-8">
              {isPasabuy && (
                <div className="bg-plum-50 border border-plum-200 rounded-2xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-plum-700 font-semibold text-sm">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    Personal Shopping
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

              <div className="flex items-center flex-wrap gap-3 mb-3">
                {product.category && (
                  <div className="flex items-center gap-1 text-primary-700 text-sm">
                    <Tag className="h-3 w-3" />
                    <span>{product.category}</span>
                  </div>
                )}
                {product.authenticated && (
                  <div className="flex items-center gap-1 text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Authenticated</span>
                  </div>
                )}
              </div>

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

              {/* Primary CTA + wishlist */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!isPasabuy && availableStock <= 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold tracking-wide transition-all duration-200 ${
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
                      {isPasabuy ? 'Order Placed!' : 'Added to Cart!'}
                    </>
                  ) : (
                    <>
                      {isPasabuy ? <Truck className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                      {isPasabuy ? 'Order Now' : availableStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </>
                  )}
                </button>

                {session?.user.role !== 'ADMIN' && session?.user.role !== 'SHIPPER' && (
                  <button
                    onClick={handleWishlist}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full border border-stone-200 hover:bg-stone-50 transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-600 text-red-600' : 'text-espresso/60'}`} />
                  </button>
                )}
              </div>

              {/* Info box */}
              <div className="mt-6 p-4 bg-primary-50 rounded-2xl text-sm text-primary-800">
                <p className="font-medium mb-1">Deposit-based reservation</p>
                <p className="text-primary-700 text-xs">
                  After placing your order, stock will be reserved for 24 hours. You&apos;ll need to submit proof of deposit to confirm your order.
                </p>
              </div>

              {/* Product details — only shown for fields that have a value */}
              {(product.subcategory || product.color || product.size || product.dimension || product.hardware || product.inclusions) && (
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Product Details</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {product.subcategory && (
                      <div>
                        <dt className="text-espresso/40 text-xs mb-0.5">Type</dt>
                        <dd className="text-espresso">{product.subcategory}</dd>
                      </div>
                    )}
                    {product.color && (
                      <div>
                        <dt className="text-espresso/40 text-xs mb-0.5">Color</dt>
                        <dd className="text-espresso">{product.color}</dd>
                      </div>
                    )}
                    {product.size && (
                      <div>
                        <dt className="text-espresso/40 text-xs mb-0.5">Size</dt>
                        <dd className="text-espresso">{product.size}</dd>
                      </div>
                    )}
                    {product.dimension && (
                      <div className="col-span-2">
                        <dt className="text-espresso/40 text-xs mb-0.5">Dimensions</dt>
                        <dd className="text-espresso">{product.dimension}</dd>
                      </div>
                    )}
                    {product.hardware && (
                      <div className="col-span-2">
                        <dt className="text-espresso/40 text-xs mb-0.5">Leather / Hardware</dt>
                        <dd className="text-espresso">{product.hardware}</dd>
                      </div>
                    )}
                    {product.inclusions && (
                      <div className="col-span-2">
                        <dt className="text-espresso/40 text-xs mb-0.5">Inclusions</dt>
                        <dd className="text-espresso">{product.inclusions}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display font-black text-2xl text-espresso mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
