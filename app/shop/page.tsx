'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { Search, SlidersHorizontal, Package, Truck, ShieldCheck, Lock, MessageCircle, Check } from 'lucide-react';
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

  // Keep the filter in sync when the ?category= URL param changes from a
  // same-page navigation (hero carousel, brand tiles, navbar dropdown) —
  // the useState above only reads it on first mount.
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  const [brandFeatured, setBrandFeatured] = useState<{ category: string; name: string; imageUrl: string }[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Sample one product per brand/category — used for both the hero carousel
  // and the "Shop by Brand" tiles. Fetched unfiltered so it's unaffected by
  // the current search/stock filters.
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        const seen = new Set<string>();
        const featured: { category: string; name: string; imageUrl: string }[] = [];
        for (const p of data) {
          if (p.category && p.imageUrl && !seen.has(p.category)) {
            seen.add(p.category);
            featured.push({ category: p.category, name: p.name, imageUrl: p.imageUrl });
          }
        }
        setBrandFeatured(featured);
      })
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

      {/* Hero Banner — full-bleed carousel of featured brand photography */}
      <div className="relative text-cream bg-espresso overflow-hidden h-[420px] sm:h-[500px]">
        <HeroCarousel slides={brandFeatured} />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/10 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 sm:pb-28">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-px bg-primary-400" />
            <p className="text-xs uppercase tracking-[0.3em] text-cream/70">{siteConfig.heroEyebrow}</p>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-2 max-w-md">
            {siteConfig.heroHeadline}
          </h1>
          <p className="text-cream/60 max-w-sm text-sm">
            {siteConfig.heroSubtext}
          </p>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-white border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, label: 'Authenticity Checked', desc: 'Condition & provenance verified' },
            { icon: Lock, label: 'Secure Reservation', desc: 'Deposit-based checkout' },
            { icon: Truck, label: 'Pasabuy Sourcing', desc: 'We source it on request' },
            { icon: MessageCircle, label: 'Sales Concierge', desc: 'Personal assistance, always' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-espresso">{label}</p>
                <p className="text-xs text-espresso/50 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-px bg-primary-500" />
          <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">The Collection</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <h2 className="font-display font-black text-3xl text-espresso">Shop Everything</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-stone-200 text-espresso placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            />
          </div>
        </div>

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

      {/* Personal sourcing / concierge */}
      <div className="bg-stone-50 border-y border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-px bg-primary-500" />
              <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">Personal Sourcing</p>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-espresso mb-4">
              Can&apos;t Find the Piece You Want?
            </h2>
            <p className="text-espresso/60 mb-8 max-w-md">
              Our Pasabuy service sources specific pieces on your behalf when they&apos;re not already
              in stock, backed by a dedicated sales concierge from inquiry to delivery.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { title: 'Direct Brand Sourcing', desc: 'We source pieces on request when they are not already on hand.' },
                { title: 'Authenticated & Verified', desc: 'Every piece is checked for condition and authenticity before it reaches you.' },
                { title: 'Personal Concierge', desc: 'A dedicated sales associate guides you from inquiry to delivery.' },
              ].map((f, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-espresso">{f.title}</p>
                    <p className="text-xs text-espresso/50">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/contact" className="btn-primary inline-block">Contact Sales Concierge</Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-warm">
            <img
              src="https://images.unsplash.com/photo-1589731119540-c4586781dae1?w=1000&q=80"
              alt="Personal sourcing"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Shop by brand */}
      {siteConfig.showBrandGrid && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-px bg-primary-500" />
            <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">Maisons</p>
          </div>
          <h2 className="font-display font-black text-3xl text-espresso mb-1">Shop by Brand</h2>
          <p className="text-espresso/50 text-sm mb-8">Curated houses, authenticated pieces</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const sample = brandFeatured.find((b) => b.category === cat.name)?.imageUrl;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-espresso shadow-soft hover:shadow-warm transition-shadow duration-300"
                >
                  {sample ? (
                    <img
                      src={sample}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/50 to-espresso/10 group-hover:via-espresso/70 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-6">
                    <span className="font-display font-black text-2xl sm:text-3xl text-cream tracking-wide drop-shadow-sm">
                      {cat.name}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-primary-300 border-b border-primary-400/60 pb-1 group-hover:text-primary-200 group-hover:border-primary-200 transition-colors">
                      Discover the Collection
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Experience / CTA */}
      <div className="bg-espresso text-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-[11px] uppercase tracking-widest font-medium mb-4">
            Every Order
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-3">The Holy Grail Experience</h2>
          <p className="text-cream/60 max-w-lg mx-auto mb-12">
            Every order is backed by the same standard of care, from first inquiry to final delivery.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 text-left">
            {[
              { icon: ShieldCheck, title: 'Authenticated Pieces', desc: 'Condition and provenance checked before every sale.' },
              { icon: Lock, title: 'Secure Checkout', desc: 'Deposit-based reservation with a 24-hour hold.' },
              { icon: Truck, title: 'Global Sourcing', desc: 'Pasabuy sourcing for pieces not already in stock.' },
              { icon: MessageCircle, title: 'Sales Concierge', desc: 'Personal assistance on every order.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <Icon className="h-5 w-5 text-primary-400 mb-3" />
                <p className="text-sm font-semibold mb-1">{title}</p>
                <p className="text-xs text-cream/50">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary"
            >
              Browse the Collection
            </button>
            <Link href="/contact" className="btn-outline-light">Contact Us</Link>
          </div>
        </div>
      </div>

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
