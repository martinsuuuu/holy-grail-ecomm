'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/utils';
import { orderRefFromNotification, resolveOrderHref } from '@/lib/notificationLink';
import { Bell, CheckCheck, Check, Info, AlertTriangle, ShoppingBag, Cake } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
  userId: string | null;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications);
    setIsLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

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

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'orders') return n.type === 'ORDER';
    if (filter === 'warnings') return n.type === 'WARNING';
    if (filter === 'birthdays') return n.type === 'BIRTHDAY' || n.type === 'BIRTHDAY_DIGEST';
    return true;
  });

  const openNotification = async (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    const href = await resolveOrderHref(n, 'ADMIN');
    if (href) router.push(href);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="h-4 w-4 text-sky-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'BIRTHDAY':
      case 'BIRTHDAY_DIGEST':
        return <Cake className="h-4 w-4 text-pink-500" />;
      default: return <Info className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'ORDER': return 'bg-sky-50';
      case 'WARNING': return 'bg-amber-50';
      case 'BIRTHDAY':
      case 'BIRTHDAY_DIGEST':
        return 'bg-pink-50';
      default: return 'bg-emerald-50';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Notifications</h1>
          <p className="text-stone-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: `Unread (${unreadCount})` },
          { value: 'orders', label: 'Orders' },
          { value: 'warnings', label: 'Warnings' },
          { value: 'birthdays', label: 'Birthdays' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-primary-600 text-espresso'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-stone-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-12 text-center">
          <Bell className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-espresso mb-2">No notifications</h3>
          <p className="text-stone-500 text-sm">Nothing to see here yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              onClick={orderRefFromNotification(notification) ? () => openNotification(notification) : undefined}
              className={`bg-white rounded-2xl shadow-soft border p-4 flex items-start gap-4 transition-colors ${
                orderRefFromNotification(notification) ? 'cursor-pointer hover:border-primary-300 ' : ''
              }${
                !notification.read ? 'border-primary-200 bg-primary-50/30' : 'border-stone-200/70'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeBg(notification.type)}`}>
                {getTypeIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`font-medium text-sm ${!notification.read ? 'text-espresso' : 'text-stone-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-stone-400">{timeAgo(notification.createdAt)}</span>
                    {!notification.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                        className="p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
