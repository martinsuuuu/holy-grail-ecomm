import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING_DEPOSIT: 'bg-yellow-100 text-yellow-800',
    DEPOSIT_SUBMITTED: 'bg-blue-100 text-blue-800',
    WAITING_FOR_ARRIVAL: 'bg-orange-100 text-orange-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_DEPOSIT: 'Pending Deposit',
    DEPOSIT_SUBMITTED: 'Deposit Submitted',
    WAITING_FOR_ARRIVAL: 'Waiting for Arrival',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

const CID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateCustomerId(): string {
  return Array.from({ length: 6 }, () =>
    CID_CHARS[Math.floor(Math.random() * CID_CHARS.length)]
  ).join('');
}
