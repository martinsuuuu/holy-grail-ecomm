'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import { Bell, CheckCheck, Check, ShoppingBag, Info, ArrowLeft } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export default function CustomerNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => { setNotifications(data.notifications ?? []); setIsLoading(false); });
  }, [session]);

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'orders') return n.type === 'ORDER';
    return true;
  });

  const getTypeIcon = (type: string) => {
    if (type === 'ORDER') return <ShoppingBag className="h-4 w-4 text-sky-500" />;
    return <Info className="h-4 w-4 text-emerald-600" />;
  };

  const getTypeBg = (type: string) => {
    if (type === 'ORDER') return 'bg-sky-50';
    return 'bg-emerald-50';
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="text-espresso/50 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-display font-semibold text-espresso">Notifications</h1>
            <p className="text-sm text-espresso/50 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-900 font-medium"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread (${unreadCount})` },
            { value: 'orders', label: 'Orders' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-espresso text-cream'
                  : 'bg-white text-espresso/70 border border-stone-200 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-stone-200/70" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-12 text-center">
            <Bell className="h-12 w-12 text-stone-200 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-espresso/80 mb-1">No notifications</h3>
            <p className="text-stone-400 text-sm">Nothing to see here yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border p-4 flex items-start gap-4 transition-colors ${
                  !n.read ? 'border-primary-200 bg-primary-50/40' : 'border-stone-200/70'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeBg(n.type)}`}>
                  {getTypeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-medium text-sm ${!n.read ? 'text-espresso' : 'text-espresso/70'}`}>{n.title}</p>
                      <p className="text-sm text-espresso/50 mt-0.5">{n.message}</p>
                      <p className="text-xs text-stone-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-1 text-primary-400 hover:text-primary-700 hover:bg-primary-100 rounded flex-shrink-0 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
