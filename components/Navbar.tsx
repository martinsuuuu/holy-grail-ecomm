'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Heart, User, LogOut, Settings, ChevronDown, Menu, X, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import HGMonogram from './HGMonogram';
import AnnouncementBar from './AnnouncementBar';
import { SOCIAL_LINKS } from './SocialIcons';
import { useCartStore } from '@/lib/cartStore';
import { useWishlistStore } from '@/lib/wishlistStore';
import { ITEM_TYPES } from '@/lib/productTypes';

interface Category {
  id: string;
  name: string;
}

interface FeaturedByCategory {
  category: string;
  name: string;
  imageUrl: string;
}

// Hover-triggered mega menu: a text list of brands on the left plus a
// couple of featured product tiles on the right, so hovering a nav tab
// surfaces more than just a plain link list. Click still works too, for
// touch devices and keyboard users.
function NavDropdown({
  label,
  categories,
  hrefFor,
  featured,
  listLabel = 'Brands',
  allLabel = 'Shop All',
  allHref = '/shop',
}: {
  label: string;
  categories: Category[];
  hrefFor: (name: string) => string;
  featured: FeaturedByCategory[];
  listLabel?: string;
  allLabel?: string;
  allHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const tiles = featured.slice(0, 2);

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-sm font-medium tracking-wide uppercase transition-colors ${
          open ? 'text-espresso' : 'text-espresso/80 hover:text-espresso'
        }`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[420px] bg-white rounded-2xl shadow-warm border border-stone-200/70 p-5 z-50 flex gap-5">
          <div className="w-32 flex-shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">{listLabel}</p>
            <div className="space-y-1.5 mb-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={hrefFor(cat.name)}
                  className="block text-sm text-espresso/80 hover:text-primary-700"
                  onClick={() => setOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link
              href={allHref}
              onClick={() => setOpen(false)}
              className="inline-block text-[11px] uppercase tracking-widest font-semibold bg-espresso text-cream px-3 py-1.5 rounded-full hover:bg-primary-800 transition-colors"
            >
              {allLabel}
            </Link>
          </div>

          {tiles.length > 0 && (
            <div className="flex-1 grid grid-cols-2 gap-3">
              {tiles.map((tile) => (
                <Link
                  key={tile.category}
                  href={hrefFor(tile.category)}
                  onClick={() => setOpen(false)}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 mb-1.5">
                    <img
                      src={tile.imageUrl}
                      alt={tile.category}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs font-semibold text-espresso group-hover:text-primary-700">{tile.category}</p>
                  <p className="text-[11px] text-espresso/40 truncate">{tile.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredByBrand, setFeaturedByBrand] = useState<FeaturedByCategory[]>([]);
  const [featuredByType, setFeaturedByType] = useState<FeaturedByCategory[]>([]);
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // One representative product photo per brand, and per item type, for the
  // nav dropdowns' featured tiles.
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: { category: string | null; itemType: string | null; name: string; imageUrl: string | null }[]) => {
        const sampleOnePer = (key: 'category' | 'itemType') => {
          const seen = new Set<string>();
          const result: FeaturedByCategory[] = [];
          for (const p of data) {
            const value = p[key];
            if (value && p.imageUrl && !seen.has(value)) {
              seen.add(value);
              result.push({ category: value, name: p.name, imageUrl: p.imageUrl });
            }
          }
          return result;
        };
        setFeaturedByBrand(sampleOnePer('category'));
        setFeaturedByType(sampleOnePer('itemType'));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.user.role === 'CUSTOMER') fetchWishlist();
  }, [session?.user.role, fetchWishlist]);

  const categoryHref = (name: string) => `/shop?category=${encodeURIComponent(name)}`;
  const itemTypeHref = (name: string) => `/shop?itemType=${encodeURIComponent(name)}`;
  const itemTypeOptions: Category[] = ITEM_TYPES.map((t) => ({ id: t, name: t }));

  return (
    <>
    <AnnouncementBar />
    <nav className="bg-cream/95 backdrop-blur shadow-soft sticky top-0 z-40">
      {/* Row 1: logo + account actions */}
      <div className="border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 items-center h-16">
            <div className="hidden md:block" />

            <Link href="/shop" className="flex items-center gap-2 sm:gap-2.5 justify-self-start md:justify-self-center min-w-0">
              <HGMonogram className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" />
              <span className="font-display font-black text-base sm:text-xl tracking-wide text-espresso whitespace-nowrap">HOLY GRAIL</span>
            </Link>

            <div className="flex items-center gap-3 justify-self-end">
              {session && <NotificationBell />}

              {session?.user.role === 'CUSTOMER' && (
                <Link
                  href="/account/wishlist"
                  className="relative p-2 text-espresso/70 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {session?.user.role === 'CUSTOMER' && (
                <Link
                  href="/shop/cart"
                  className="relative p-2 text-espresso/70 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 py-2 px-3 rounded-full hover:bg-primary-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-700">
                        {session.user.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-espresso/80 hidden sm:block">
                      {session.user.name}
                    </span>
                    <ChevronDown className="h-3 w-3 text-espresso/50" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-warm border border-stone-200/70 py-1 z-50">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs text-espresso/50">{session.user.email}</p>
                        <p className="text-xs font-medium text-primary-700 capitalize">{session.user.role?.toLowerCase()}</p>
                      </div>
                      {session.user.role === 'CUSTOMER' && (
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-espresso/80 hover:bg-primary-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          My Account
                        </Link>
                      )}
                      {session.user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-espresso/80 hover:bg-primary-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-sm font-medium text-espresso/80 hover:text-primary-700">
                    Login
                  </Link>
                  <Link href="/register" className="btn-primary text-sm py-1.5">
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-espresso/70 hover:text-espresso"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: nav links + search (desktop) */}
      <div className="hidden md:block border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center gap-8 h-12">
            <div className="absolute left-4 lg:left-6 flex items-center gap-3.5">
              {SOCIAL_LINKS.map(({ label, Icon, href }) =>
                href ? (
                  <Link key={label} href={href} aria-label={label} className="text-espresso/60 hover:text-espresso transition-colors">
                    <Icon className="h-4 w-4" />
                  </Link>
                ) : (
                  <span key={label} aria-label={label} className="text-espresso/60">
                    <Icon className="h-4 w-4" />
                  </span>
                )
              )}
            </div>

            <Link href="/shop" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
              New In
            </Link>
            <NavDropdown label="Shop by Brands" categories={categories} hrefFor={categoryHref} featured={featuredByBrand} listLabel="Brands" allLabel="Shop All" allHref="/shop" />
            <NavDropdown label="Shop by Categories" categories={itemTypeOptions} hrefFor={itemTypeHref} featured={featuredByType} listLabel="Categories" allLabel="Shop All" allHref="/shop" />
            <Link href="/shop?itemType=Apparels" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
              Fashion
            </Link>
            <Link href="/about" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
              About
            </Link>
            <Link href="/faq" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
              Contact
            </Link>
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
                Admin Panel
              </Link>
            )}
            {session?.user.role === 'SHIPPER' && (
              <Link href="/shipper" className="text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors">
                Shipper Panel
              </Link>
            )}

            <Link
              href="/shop"
              className="absolute right-4 lg:right-6 p-2 text-espresso/70 hover:text-espresso hover:bg-stone-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-stone-100 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/shop"
            className="flex items-center gap-2 py-2 text-espresso/70 hover:text-espresso"
            onClick={() => setIsMenuOpen(false)}
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <Link href="/shop" className="block py-2 text-espresso/70 hover:text-espresso font-medium" onClick={() => setIsMenuOpen(false)}>
            New In
          </Link>
          <Link href="/shop" className="block py-2 text-espresso/70 hover:text-espresso font-medium" onClick={() => setIsMenuOpen(false)}>
            Shop All
          </Link>
          <Link href="/shop?itemType=Apparels" className="block py-2 text-espresso/70 hover:text-espresso font-medium" onClick={() => setIsMenuOpen(false)}>
            Fashion
          </Link>
          {categories.length > 0 && (
            <div className="py-2">
              <p className="text-xs font-medium text-espresso/40 uppercase tracking-wide mb-1">Brands &amp; Categories</p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={categoryHref(cat.name)}
                  className="block py-1.5 pl-2 text-espresso/70 hover:text-espresso"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
          <Link href="/about" className="block py-2 text-espresso/70 hover:text-espresso" onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
          <Link href="/faq" className="block py-2 text-espresso/70 hover:text-espresso" onClick={() => setIsMenuOpen(false)}>
            FAQ
          </Link>
          <Link href="/contact" className="block py-2 text-espresso/70 hover:text-espresso" onClick={() => setIsMenuOpen(false)}>
            Contact
          </Link>
          {session?.user.role === 'ADMIN' && (
            <Link href="/admin" className="block py-2 text-espresso/70 hover:text-espresso" onClick={() => setIsMenuOpen(false)}>
              Admin Panel
            </Link>
          )}
          {session?.user.role === 'SHIPPER' && (
            <Link href="/shipper" className="block py-2 text-espresso/70 hover:text-espresso" onClick={() => setIsMenuOpen(false)}>
              Shipper Panel
            </Link>
          )}

          <div className="flex items-center gap-5 pt-4 mt-2 border-t border-stone-100">
            {SOCIAL_LINKS.map(({ label, Icon, href }) =>
              href ? (
                <Link key={label} href={href} aria-label={label} className="text-espresso/60 hover:text-espresso transition-colors">
                  <Icon className="h-5 w-5" />
                </Link>
              ) : (
                <span key={label} aria-label={label} className="text-espresso/60">
                  <Icon className="h-5 w-5" />
                </span>
              )
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
