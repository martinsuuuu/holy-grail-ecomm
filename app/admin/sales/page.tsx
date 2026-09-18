'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  items: number;
}

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  totalExpenses: number;
  netProfit: number;
}

// Fixed (not random) so server and client render identical markup — a
// randomized loading skeleton causes a hydration mismatch since the server
// and client each compute their own random values independently.
const SKELETON_BAR_HEIGHTS = [45, 70, 35, 85, 55, 40, 75, 60];

export default function AdminSalesPage() {
  const [period, setPeriod] = useState('monthly');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/admin/sales?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setSalesData(data.salesData);
        setSummary(data.summary);
        setIsLoading(false);
      });
  }, [period]);

  const maxRevenue = salesData.length > 0 ? Math.max(...salesData.map(d => d.revenue)) : 1;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Sales Summary</h1>
          <p className="text-stone-500 text-sm mt-1">Revenue and performance overview</p>
        </div>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                period === p ? 'bg-primary-600 text-espresso' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Revenue',
              value: formatCurrency(summary.totalRevenue),
              icon: DollarSign,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Total Orders',
              value: summary.totalOrders.toString(),
              icon: ShoppingBag,
              color: 'text-sky-600',
              bg: 'bg-sky-50',
            },
            {
              label: 'Total Expenses',
              value: formatCurrency(summary.totalExpenses),
              icon: TrendingUp,
              color: 'text-red-600',
              bg: 'bg-red-50',
            },
            {
              label: 'Net Profit',
              value: formatCurrency(summary.netProfit),
              icon: BarChart3,
              color: summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
              bg: summary.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-espresso">{stat.value}</p>
                <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 p-6 mb-6">
        <h2 className="font-display font-semibold text-espresso mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          Revenue Chart ({period.charAt(0).toUpperCase() + period.slice(1)})
        </h2>

        {isLoading ? (
          <div className="flex items-end gap-2 h-48">
            {SKELETON_BAR_HEIGHTS.map((h, i) => (
              <div key={i} className="flex-1 bg-stone-200 rounded-t animate-pulse" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : salesData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-stone-400">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-stone-300" />
              <p className="text-sm">No sales data for this period</p>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-1 h-48 overflow-x-auto">
            {salesData.map((data, index) => {
              const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="flex flex-col items-center gap-1 flex-1 min-w-12 h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-espresso text-cream text-xs rounded-xl px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <p className="font-medium">{data.date}</p>
                    <p>Revenue: {formatCurrency(data.revenue)}</p>
                    <p>Orders: {data.orders}</p>
                  </div>
                  {/* This inner cell is what gives the bar below a definite
                      height to compute its percentage against — a flex
                      column's auto-sized children can't resolve a % height
                      on their own. */}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-primary-500 hover:bg-primary-600 rounded-t transition-all cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 w-full text-center truncate">{data.date}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h2 className="font-display font-semibold text-espresso">Sales Breakdown</h2>
        </div>
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase">Period</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase">Orders</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase">Items Sold</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-stone-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : salesData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-stone-500 text-sm">
                  No sales data for this period
                </td>
              </tr>
            ) : (
              [...salesData].reverse().map((data, index) => (
                <tr key={index} className="hover:bg-stone-50/60">
                  <td className="px-6 py-4 font-medium text-sm text-espresso">{data.date}</td>
                  <td className="px-6 py-4 text-right text-sm text-stone-600">{data.orders}</td>
                  <td className="px-6 py-4 text-right text-sm text-stone-600">{data.items}</td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-primary-700">
                    {formatCurrency(data.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!isLoading && salesData.length > 0 && summary && (
            <tfoot className="bg-stone-50 border-t border-stone-200">
              <tr>
                <td className="px-6 py-3 font-semibold text-sm text-stone-700">Total</td>
                <td className="px-6 py-3 text-right font-semibold text-sm text-stone-700">{summary.totalOrders}</td>
                <td className="px-6 py-3 text-right font-semibold text-sm text-stone-700">
                  {salesData.reduce((sum, d) => sum + d.items, 0)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-sm text-primary-700">
                  {formatCurrency(summary.totalRevenue)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
