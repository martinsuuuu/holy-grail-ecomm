'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Search, SlidersHorizontal, Package, Truck } from 'lucide-react';

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

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [sort, setSort] = useState<SortOption>('');

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold mb-2">Shop Our Products</h1>
          <p className="text-indigo-200">Discover great deals across all our categories</p>

          {/* Search bar */}
          <div className="mt-6 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 border-0 focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
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
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">In stock only</span>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : isSearching ? (
          /* Search results — show all together, pasabuy highlighted */
          <>
            <p className="text-sm text-gray-500 mb-4">
              {products.length} product{products.length !== 1 ? 's' : ''} found
              {pasabuyProducts.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-purple-600 font-medium">
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
                  <div className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl">
                    <Truck className="h-4 w-4" />
                    <span className="font-semibold text-sm">Pasabuy Items</span>
                  </div>
                  <p className="text-sm text-gray-500">Order now and we&apos;ll source it for you</p>
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
                    <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl">
                      <Package className="h-4 w-4" />
                      <span className="font-semibold text-sm">On Hand</span>
                    </div>
                    <p className="text-sm text-gray-500">Ready to ship</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-4">
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
    </div>
  );
}
