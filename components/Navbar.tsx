'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Heart, User, LogOut, Settings, ChevronDown, Menu, X, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import HGMonogram from './HGMonogram';
import AnnouncementBar from './AnnouncementBar';
import { useCartStore } from '@/lib/cartStore';
import { useWishlistStore } from '@/lib/wishlistStore';

interface Category {
  id: string;
  name: string;
}

function NavDropdown({ label, categories, hrefFor }: { label: string; categories: Category[]; hrefFor: (name: string) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-espresso/80 hover:text-espresso text-sm font-medium tracking-wide uppercase transition-colors"
      >
        {label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 mt-3 w-56 bg-white shadow-warm border border-stone-200/70 py-2 z-50">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={hrefFor(cat.name)}
              className="block px-4 py-2 text-sm text-espresso/80 hover:bg-stone-50 hover:text-espresso"
              onClick={() => setOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
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
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.user.role === 'CUSTOMER') fetchWishlist();
  }, [session?.user.role, fetchWishlist]);

  const categoryHref = (name: string) => `/shop?category=${encodeURIComponent(name)}`;

  return (
    <>
    <AnnouncementBar />
    <nav className="bg-cream/95 backdrop-blur shadow-soft border-b border-stone-200/70 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center h-18 py-3">
          {/* Left: dropdown nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavDropdown label="Shop by Brands" categories={categories} hrefFor={categoryHref} />
            <NavDropdown label="Shop by Categories" categories={categories} hrefFor={categoryHref} />
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
          </div>

          {/* Center: Logo */}
          <Link href="/shop" className="flex items-center justify-center md:justify-center gap-2.5 justify-self-start md:justify-self-auto">
            <HGMonogram className="h-10 w-10" />
            <span className="font-display font-black text-xl tracking-wide text-espresso hidden sm:inline">HOLY GRAIL</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-3 justify-self-end">
            <Link
              href="/shop"
              className="hidden md:flex p-2 text-espresso/70 hover:text-espresso hover:bg-stone-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Link>

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

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-stone-100">
            <Link href="/shop" className="block py-2 text-espresso/70 hover:text-espresso font-medium" onClick={() => setIsMenuOpen(false)}>
              Shop All
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
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
