'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import HeroCarousel, { Slide } from '@/components/HeroCarousel';
import VideoCarousel from '@/components/VideoCarousel';
import { Search, SlidersHorizontal, Package, Truck, ShieldCheck, Lock, MessageCircle, Check, ArrowUpRight, Star, ChevronDown, X, Mail, MapPin } from 'lucide-react';
import { DEFAULT_SITE_CONFIG, SiteConfig, THEME_TEXTURE_URL } from '@/lib/siteConfig';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  reserved: number;
  category: string | null;
  itemType: string | null;
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

const COLLECTION_DISPLAY_LIMIT = 16;

function ShopPageInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedItemType, setSelectedItemType] = useState(searchParams.get('itemType') || 'all');
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [sort, setSort] = useState<SortOption>('');
  const [showAllCollection, setShowAllCollection] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setFilterPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  // Keep the filters in sync when the ?category=/?itemType= URL params change
  // from a same-page navigation (hero carousel, brand tiles, navbar
  // dropdown) — the useState above only reads them on first mount.
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedItemType(searchParams.get('itemType') || 'all');
  }, [searchParams]);

  const [brandFeatured, setBrandFeatured] = useState<{ category: string; name: string; imageUrl: string }[]>([]);
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({});
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [itemTypes, setItemTypes] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
    fetch('/api/item-types')
      .then((r) => r.json())
      .then((data: { name: string }[]) => setItemTypes(data.map((t) => t.name)))
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
        const counts: Record<string, number> = {};
        for (const p of data) {
          if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
          if (p.category && p.imageUrl && !seen.has(p.category)) {
            seen.add(p.category);
            featured.push({ category: p.category, name: p.name, imageUrl: p.imageUrl });
          }
        }
        setBrandFeatured(featured);
        setBrandCounts(counts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/site-config')
      .then((r) => r.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  // When embedded as the Site Editor's live preview iframe, the editor posts
  // the admin's in-progress (unsaved) config on every change so they can see
  // edits before saving — this page never initiates that itself.
  useEffect(() => {
    function handlePreviewMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'HOLY_GRAIL_PREVIEW_CONFIG') {
        setSiteConfig(e.data.config);
      }
    }
    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedItemType !== 'all') params.set('itemType', selectedItemType);
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
  }, [search, selectedCategory, selectedItemType, showInStockOnly, sort]);

  // Start back at the 16-item cap whenever the filtered set changes, so
  // "Show All" doesn't stay expanded across an unrelated filter switch.
  useEffect(() => {
    setShowAllCollection(false);
  }, [search, selectedCategory, selectedItemType, showInStockOnly, sort]);

  const pasabuyProducts = products.filter(p => p.type === 'PASABUY');
  const regularProducts = products.filter(p => p.type !== 'PASABUY');
  const isSearching = search.trim().length > 0;
  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) + (selectedItemType !== 'all' ? 1 : 0) + (sort ? 1 : 0);

  // Custom slides from the site editor take priority; otherwise fall back to
  // one auto-sampled product photo per brand/category.
  const customSlides: Slide[] = siteConfig.heroSlides
    .filter((s) => s.image)
    .map((s) => ({
      image: s.image!,
      eyebrow: s.eyebrow || undefined,
      caption: s.caption || undefined,
      subcaption: s.subcaption || undefined,
      href: s.link || undefined,
    }));
  const BRAND_GRID_LIMIT = 8;
  // Auto-generated hero slides are capped to the top brands by stock —
  // with 40+ brands, one slide per brand made the dot pagination row
  // unreadably crowded and took several minutes to cycle through once.
  const autoSlides: Slide[] = [...brandFeatured]
    .sort((a, b) => (brandCounts[b.category] || 0) - (brandCounts[a.category] || 0))
    .slice(0, BRAND_GRID_LIMIT)
    .map((b) => ({
      image: b.imageUrl,
      eyebrow: 'Now Featuring',
      caption: b.category,
      subcaption: b.name,
      href: `/shop?category=${encodeURIComponent(b.category)}`,
    }));
  const heroSlides = customSlides.length > 0 ? customSlides : autoSlides;

  const sortedCategories = [...categories].sort(
    (a, b) => (brandCounts[b.name] || 0) - (brandCounts[a.name] || 0)
  );
  const visibleCategories = showAllBrands ? sortedCategories : sortedCategories.slice(0, BRAND_GRID_LIMIT);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero Banner — full-bleed carousel of featured brand photography */}
      <div className="relative text-cream bg-espresso overflow-hidden h-[420px] sm:h-[500px]">
        <HeroCarousel slides={heroSlides} />
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

      {/* Quick actions */}
      <div className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {siteConfig.quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="group flex items-start justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-5 hover:border-primary-300 hover:shadow-soft transition-all"
            >
              <div>
                <p className="text-[11px] font-semibold text-primary-600 mb-1">{String(i + 1).padStart(2, '0')}</p>
                <p className="text-sm font-semibold text-espresso mb-1">{action.label}</p>
                <p className="text-xs text-espresso/50 leading-relaxed">{action.desc}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-espresso/30 group-hover:text-primary-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-white border-b border-stone-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[ShieldCheck, Lock, Truck, MessageCircle].map((Icon, i) => {
            const item = siteConfig.trustItems[i];
            if (!item) return null;
            const { label, desc } = item;
            return (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-espresso">{label}</p>
                  <p className="text-xs text-espresso/50 mt-0.5">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video carousel */}
      {siteConfig.videos.length > 0 && (
        <div className="bg-cream py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="w-10 h-px bg-primary-500" />
              <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">{siteConfig.videosEyebrow}</p>
            </div>
            <h2 className="font-display font-black text-3xl text-espresso mb-8">{siteConfig.videosHeading}</h2>
            <VideoCarousel videos={siteConfig.videos} />
          </div>
        </div>
      )}

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
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setFilterPanelOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                filterPanelOpen
                  ? 'bg-espresso text-cream border-espresso'
                  : 'bg-white text-espresso/70 border-stone-200 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-white text-[11px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filterPanelOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterPanelOpen && (
              <div className="absolute left-0 mt-2 w-[300px] bg-white rounded-2xl shadow-warm border border-stone-200/70 p-5 z-30 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-espresso/50 mb-1.5">Brand</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 text-espresso bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="all">All Brands</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-espresso/50 mb-1.5">Category</label>
                  <select
                    value={selectedItemType}
                    onChange={(e) => setSelectedItemType(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 text-espresso bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="all">All Categories</option>
                    {itemTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-espresso/50 mb-1.5">Sort By</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 text-espresso bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="">Default</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="price_asc">Price: Low to High</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInStockOnly}
                    onChange={(e) => setShowInStockOnly(e.target.checked)}
                    className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-espresso/70">In stock only</span>
                </label>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedItemType('all');
                      setSort('');
                      setShowInStockOnly(true);
                    }}
                    className="flex-1 px-3 py-2 rounded-full border border-stone-200 text-sm font-medium text-espresso/70 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setFilterPanelOpen(false)}
                    className="flex-1 px-3 py-2 rounded-full bg-espresso text-cream text-sm font-medium hover:bg-primary-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active filter chips — only the ones actually selected, not the whole list */}
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-800 text-sm font-medium hover:bg-primary-100 transition-colors"
            >
              {selectedCategory}
              <X className="h-3 w-3" />
            </button>
          )}
          {selectedItemType !== 'all' && (
            <button
              onClick={() => setSelectedItemType('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-800 text-sm font-medium hover:bg-primary-100 transition-colors"
            >
              {selectedItemType}
              <X className="h-3 w-3" />
            </button>
          )}
          {sort && (
            <button
              onClick={() => setSort('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-800 text-sm font-medium hover:bg-primary-100 transition-colors"
            >
              {sort === 'price_desc' ? 'Price: High to Low' : 'Price: Low to High'}
              <X className="h-3 w-3" />
            </button>
          )}
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
                  {pasabuyProducts.length} personal shopping
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
                    <span className="font-semibold text-sm">Personal Shopping Items</span>
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
                  {(showAllCollection ? regularProducts : regularProducts.slice(0, COLLECTION_DISPLAY_LIMIT)).map((product) => (
                    <div key={product.id} className="flex">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                {regularProducts.length > COLLECTION_DISPLAY_LIMIT && (
                  <div className="flex justify-center mt-8">
                    {showAllCollection ? (
                      <button
                        onClick={() => setShowAllCollection(false)}
                        className="px-6 py-2.5 rounded-full border border-stone-200 text-sm font-medium text-espresso/70 hover:border-primary-300 hover:text-primary-700 transition-colors"
                      >
                        Show Less
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowAllCollection(true)}
                        className="px-6 py-2.5 rounded-full bg-espresso text-cream text-sm font-medium hover:bg-primary-800 transition-colors"
                      >
                        Show All {regularProducts.length} Items
                      </button>
                    )}
                  </div>
                )}
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
              <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">{siteConfig.sourcingEyebrow}</p>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-espresso mb-4">
              {siteConfig.sourcingHeadline}
            </h2>
            <p className="text-espresso/60 mb-8 max-w-md">
              {siteConfig.sourcingText}
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
              src={siteConfig.sourcingImage}
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
            <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">{siteConfig.brandGridEyebrow}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div>
              <h2 className="font-display font-black text-3xl text-espresso mb-1">{siteConfig.brandGridHeading}</h2>
              <p className="text-espresso/50 text-sm">{siteConfig.brandGridSubheading}</p>
            </div>
            {categories.length > BRAND_GRID_LIMIT && (
              <button
                onClick={() => setShowAllBrands((v) => !v)}
                className="flex-shrink-0 px-5 py-2 rounded-full border border-stone-200 text-sm font-medium text-espresso/70 hover:border-primary-300 hover:text-primary-700 transition-colors"
              >
                {showAllBrands ? 'Show Top 8' : `View All ${categories.length} Brands`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleCategories.map((cat) => {
              const sample = brandFeatured.find((b) => b.category === cat.name)?.imageUrl;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group relative aspect-[4/3.3] overflow-hidden rounded-2xl bg-espresso shadow-soft hover:shadow-warm transition-shadow duration-300"
                >
                  {sample ? (
                    <img
                      src={sample}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.25] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/50 to-espresso/10 group-hover:via-espresso/70 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-4">
                    <span className="font-display font-black text-lg sm:text-xl text-cream tracking-wide drop-shadow-sm">
                      {cat.name}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary-300 border-b border-primary-400/60 pb-1 group-hover:text-primary-200 group-hover:border-primary-200 transition-colors">
                      Discover the Collection
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* By the numbers */}
      <div className="bg-primary-50 border-y border-primary-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-primary-700 font-medium mb-8">
            {siteConfig.statsEyebrow}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {siteConfig.statsItems.map((stat, i) => (
              <div key={i}>
                <p className="font-display font-black text-3xl sm:text-4xl text-espresso">{stat.value}</p>
                <p className="text-xs text-espresso/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer feedback */}
      {siteConfig.testimonials.length > 0 && (
        <div className="bg-cream py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="w-10 h-px bg-primary-500" />
              <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">{siteConfig.testimonialsEyebrow}</p>
            </div>
            <h2 className="font-display font-black text-3xl text-espresso mb-8">{siteConfig.testimonialsHeading}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {siteConfig.testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden flex flex-col">
                  <div className="relative aspect-[4/3]">
                    <img src={t.image} alt={t.productName} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? 'fill-primary-500 text-primary-500' : 'text-stone-200'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-espresso/70 leading-relaxed flex-1 mb-4">&ldquo;{t.text}&rdquo;</p>
                    <div className="pt-3 border-t border-stone-100">
                      <p className="text-sm font-semibold text-espresso">{t.name}</p>
                      <p className="text-xs text-espresso/40">Purchased: {t.productName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Experience / CTA */}
      <div className="bg-cream py-16 px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-6xl mx-auto bg-espresso text-cream rounded-3xl px-6 sm:px-10 py-16 sm:py-20 text-center bg-cover bg-center"
          style={siteConfig.themeTextureEnabled ? { backgroundImage: `url('${THEME_TEXTURE_URL}')` } : undefined}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-[11px] uppercase tracking-widest font-medium mb-4">
            {siteConfig.ctaEyebrow}
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-3">{siteConfig.ctaHeadline}</h2>
          <p className="text-cream/60 max-w-lg mx-auto mb-12">
            {siteConfig.ctaText}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 text-left">
            {[
              { icon: ShieldCheck, title: 'Authenticated Pieces', desc: 'Condition and provenance checked before every sale.' },
              { icon: Lock, title: 'Secure Checkout', desc: 'Deposit-based reservation with a 24-hour hold.' },
              { icon: Truck, title: 'Global Sourcing', desc: 'Personal shopping service for pieces not already in stock.' },
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

      {/* Careers */}
      <div id="careers" className="bg-stone-50 border-t border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-px bg-primary-500" />
            <p className="text-xs uppercase tracking-[0.25em] text-primary-700 font-medium">{siteConfig.careersEyebrow}</p>
          </div>
          <h2 className="font-display font-black text-3xl text-espresso mb-3">{siteConfig.careersHeading}</h2>
          <p className="text-espresso/60 max-w-xl mb-10">{siteConfig.careersIntro}</p>

          {siteConfig.careers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {siteConfig.careers.map((career) => (
                <div key={career.id} className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6">
                  <h3 className="font-display font-bold text-lg text-espresso mb-1">{career.title}</h3>
                  {career.location && (
                    <div className="flex items-center gap-1.5 text-xs text-espresso/50 mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>{career.location}</span>
                    </div>
                  )}
                  <p className="text-sm text-espresso/70 leading-relaxed">{career.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-espresso/50 mb-10">No open positions right now — check back soon, or reach out below to introduce yourself.</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {siteConfig.careersEmail ? (
              <a href={`mailto:${siteConfig.careersEmail}`} className="btn-primary inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email {siteConfig.careersEmail}
              </a>
            ) : (
              <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Get in Touch
              </Link>
            )}
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
