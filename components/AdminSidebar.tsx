'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Truck,
  DollarSign,
  BarChart3,
  Bell,
  LogOut,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  MapPin,
  Tag,
} from 'lucide-react';
import PacifierIcon from './PacifierIcon';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/purchase-orders', label: 'Purchase Orders', icon: Truck },
  { href: '/admin/expenses', label: 'Expenses', icon: DollarSign },
  { href: '/admin/sales', label: 'Sales Summary', icon: BarChart3 },
  { href: '/admin/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { href: '/admin/delivery-settings', label: 'Delivery Settings', icon: MapPin },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [noActivePayment, setNoActivePayment] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/admin/payment-methods')
      .then((r) => r.json())
      .then((data: { isActive: boolean; qrCode: string | null }[]) => {
        const activeWithQr = data.filter((m) => m.isActive && m.qrCode);
        setNoActivePayment(activeWithQr.length === 0);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <PacifierIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Little-Mija</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const showWarning = item.href === '/admin/payment-methods' && noActivePayment;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
              {showWarning && !isActive && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              )}
              {isActive && <ChevronRight className="h-3 w-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <Link
          href="/shop"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          Visit Shop
        </Link>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full mt-1"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
            <div className="flex items-center justify-center w-11 h-11 bg-red-100 rounded-full mx-auto mb-4">
              <LogOut className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 text-center">Sign out?</h2>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5">You will be returned to the login page.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
