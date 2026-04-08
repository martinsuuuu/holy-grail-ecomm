import { db } from '@/lib/db';
import { orders, users, products, expenses } from '@/db/schema';
import { inArray, eq, lt, count, sum } from 'drizzle-orm';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Fetch stats
  const [
    totalOrdersResult,
    activeOrdersResult,
    totalCustomersResult,
    lowStockProducts,
    recentOrders,
    totalSalesResult,
    totalExpensesResult,
    pendingDepositResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(orders).where(inArray(orders.status, ['CONFIRMED', 'DEPOSIT_SUBMITTED', 'PENDING_DEPOSIT'])),
    db.select({ count: count() }).from(users).where(eq(users.role, 'CUSTOMER')),
    db.select({ id: products.id, name: products.name, stock: products.stock, category: products.category })
      .from(products)
      .where(lt(products.stock, 5))
      .orderBy(products.stock),
    db.query.orders.findMany({
      with: {
        user: { columns: { name: true, email: true } },
        items: { with: { product: { columns: { name: true } } } },
      },
      orderBy: (o, { desc }) => desc(o.createdAt),
      limit: 5,
    }),
    db.select({ total: sum(orders.totalAmount) }).from(orders).where(inArray(orders.status, ['CONFIRMED', 'SHIPPED', 'DELIVERED'])),
    db.select({ total: sum(expenses.amount) }).from(expenses),
    db.select({ count: count() }).from(orders).where(eq(orders.status, 'PENDING_DEPOSIT')),
  ]);

  const totalSales = Number(totalSalesResult[0]?.total ?? 0);
  const totalExpensesTotal = Number(totalExpensesResult[0]?.total ?? 0);
  const activeOrders = activeOrdersResult[0]?.count ?? 0;
  const totalCustomers = totalCustomersResult[0]?.count ?? 0;
  const pendingDepositOrders = pendingDepositResult[0]?.count ?? 0;

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalSales),
      icon: DollarSign,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpensesTotal),
      icon: TrendingUp,
      color: 'bg-red-500',
      bg: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: 'Active Orders',
      value: activeOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toString(),
      icon: Users,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING_DEPOSIT: 'bg-yellow-100 text-yellow-800',
      DEPOSIT_SUBMITTED: 'bg-blue-100 text-blue-800',
      WAITING_FOR_ARRIVAL: 'bg-orange-100 text-orange-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
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
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session?.user.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No orders yet</div>
            ) : (
              recentOrders.map((order) => {
                const isClickable = ['PENDING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'WAITING_FOR_ARRIVAL', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status);
                const inner = (
                  <>
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{order.user?.name}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <span className={`badge text-xs ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                      {isClickable && <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                    </div>
                  </>
                );
                return isClickable ? (
                  <Link
                    key={order.id}
                    href={`/admin/orders?order=${order.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-indigo-50 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={order.id} className="flex items-center gap-4 p-4">
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Alerts */}
          {(pendingDepositOrders > 0 || lowStockProducts.length > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Alerts
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {pendingDepositOrders > 0 && (
                  <Link href="/admin/orders" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {pendingDepositOrders} pending deposit{pendingDepositOrders > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-amber-600">Require review</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Low Stock */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-red-500" />
                Low Stock
              </h2>
              <Link href="/admin/products" className="text-xs text-indigo-600 hover:text-indigo-800">
                Manage
              </Link>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">All products well stocked!</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category}</p>
                    </div>
                    <span className={`badge text-xs ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
