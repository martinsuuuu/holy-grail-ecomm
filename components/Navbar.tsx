'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, User, LogOut, Settings, ChevronDown, Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import PacifierIcon from './PacifierIcon';
import { useCartStore } from '@/lib/cartStore';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const cartItemCount = useCartStore((state) => state.getTotalItems());

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/shop" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <PacifierIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Little-Mija</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/shop" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
              Shop
            </Link>
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Admin Panel
              </Link>
            )}
            {session?.user.role === 'SHIPPER' && (
              <Link href="/shipper" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Shipper Panel
              </Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {session && <NotificationBell />}

            {session?.user.role === 'CUSTOMER' && (
              <Link
                href="/shop/cart"
                className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-600">
                      {session.user.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {session.user.name}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                      <p className="text-xs font-medium text-indigo-600 capitalize">{session.user.role?.toLowerCase()}</p>
                    </div>
                    {session.user.role === 'CUSTOMER' && (
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                    )}
                    {session.user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
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
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <Link href="/shop" className="block py-2 text-gray-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>
              Shop
            </Link>
            {session?.user.role === 'ADMIN' && (
              <Link href="/admin" className="block py-2 text-gray-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>
                Admin Panel
              </Link>
            )}
            {session?.user.role === 'SHIPPER' && (
              <Link href="/shipper" className="block py-2 text-gray-600 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>
                Shipper Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
