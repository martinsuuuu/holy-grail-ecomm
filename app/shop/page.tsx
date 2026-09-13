'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Search, SlidersHorizontal, Package, Truck } from 'lucide-react';
import { DEFAULT_SITE_CONFIG, SiteConfig } from '@/lib/siteConfig';

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

interface Category {
  id: string;
  name: string;
}

type SortOption = '' | 'price_desc' | 'price_asc';

function ShopPageInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [sort, setSort] = useState<SortOption>('');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/site-config')
      .then((r) => r.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (search) params.set('search', search);
    // Pasabuy items don't have traditional stock — don't filter them out
    if (showInStockOnly) params.set('inStockOnly', 'true');
    if (sort) params.set('sort', sort);

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, showInStockOnly, sort]);

  const pasabuyProducts = products.filter(p => p.type === 'PASABUY');
  const regularProducts = products.filter(p => p.type !== 'PASABUY');
  const isSearching = search.trim().length > 0;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero Banner */}
      <div
        className="relative text-cream bg-espresso bg-cover bg-[center_30%]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589731119540-c4586781dae1?w=1600&q=80')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/80 to-espresso/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-cream/70 mb-2">{siteConfig.heroEyebrow}</p>
          <h1 className="font-display font-black text-6xl sm:text-8xl leading-[0.85] tracking-tight mb-4">
            {siteConfig.heroHeadline.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>
          <p className="text-cream/70 max-w-md mb-6">
            {siteConfig.heroSubtext}
          </p>

          {/* Search bar */}
          <div className="max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full text-espresso placeholder-stone-400 border-0 focus:ring-2 focus:ring-cream/60 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-espresso/60">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-espresso text-cream'
                  : 'bg-white text-espresso/70 border border-stone-200 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-espresso text-cream'
                    : 'bg-white text-espresso/70 border border-stone-200 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort + In-stock controls */}
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm border border-stone-200 rounded-full px-3 py-1.5 text-espresso/70 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Sort: Default</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInStockOnly}
                onChange={(e) => setShowInStockOnly(e.target.checked)}
                className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-espresso/70">In stock only</span>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden animate-pulse">
                <div className="h-48 bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded" />
                  <div className="h-3 bg-stone-200 rounded w-2/3" />
                  <div className="h-6 bg-stone-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-display font-medium text-espresso mb-2">No products found</h3>
            <p className="text-espresso/50 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : isSearching ? (
          /* Search results — show all together, pasabuy highlighted */
          <>
            <p className="text-sm text-espresso/50 mb-4">
              {products.length} product{products.length !== 1 ? 's' : ''} found
              {pasabuyProducts.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-plum-600 font-medium">
                  <Truck className="h-3.5 w-3.5" />
                  {pasabuyProducts.length} pasabuy
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
              {products.map((product) => (
                <div key={product.id} className="flex">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Default view — Pasabuy section first, then regular */
          <>
            {pasabuyProducts.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-plum-600 text-white px-4 py-2 rounded-full">
                    <Truck className="h-4 w-4" />
                    <span className="font-semibold text-sm">Pasabuy Items</span>
                  </div>
                  <p className="text-sm text-espresso/50">Order now and we&apos;ll source it for you</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                  {pasabuyProducts.map((product) => (
                    <div key={product.id} className="flex">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {regularProducts.length > 0 && (
              <section>
                {pasabuyProducts.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-full">
                      <Package className="h-4 w-4" />
                      <span className="font-semibold text-sm">On Hand</span>
                    </div>
                    <p className="text-sm text-espresso/50">Ready to ship</p>
                  </div>
                )}
                <p className="text-sm text-espresso/50 mb-4">
                  {regularProducts.length} product{regularProducts.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                  {regularProducts.map((product) => (
                    <div key={product.id} className="flex">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Shop by brand */}
      {siteConfig.showBrandGrid && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-display font-black text-2xl text-espresso mb-1">Shop by Brand</h2>
          <p className="text-espresso/50 text-sm mb-6">Curated houses, authenticated pieces</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-stone-200">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className="group relative bg-espresso aspect-[4/3] flex items-center justify-center overflow-hidden"
              >
                <span className="font-display font-black text-xl sm:text-2xl text-cream tracking-wide group-hover:scale-105 transition-transform">
                  {cat.name}
                </span>
                <span className="absolute bottom-3 text-[11px] uppercase tracking-widest text-cream/60 group-hover:text-cream transition-colors">
                  More Products
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ShopPageInner />
    </Suspense>
  );
}
