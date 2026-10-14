'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  current: number;
  previous: number;
  growthPct: number | null;
}

interface GroupRow {
  unitsSold: number;
  totalSales: number;
  grossProfit: number;
  netSales: number;
}

interface SalesReport {
  month: string;
  monthLabel: string;
  summary: {
    grossSales: Metric;
    netSales: Metric;
    totalOrders: Metric;
    unitsSold: Metric;
    avgOrderValue: Metric;
    grossProfit: Metric;
    newCustomers: Metric;
  };
  dailySales: Array<{
    date: string;
    orders: number;
    unitsSold: number;
    grossSales: number;
    discounts: number;
    refunds: number;
    netSales: number;
  }>;
  salesByBrand: Array<GroupRow & { brand: string }>;
  salesByCategory: Array<GroupRow & { category: string }>;
  websiteTraffic: {
    totalSessions: number | null;
    productPageViews: number | null;
    addedToCart: number | null;
    reachedCheckout: number | null;
    completedPurchases: number;
    conversionRate: number | null;
    cartAbandonmentRate: number | null;
  };
  inventoryPerformance: Array<{
    category: string;
    availableUnits: number;
    unitsSold: number;
    salesRevenue: number;
    sellThroughRate: number;
  }>;
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-stone-400">New</span>;
  }
  const isFlat = Math.abs(pct) < 0.05;
  const Icon = isFlat ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  const color = isFlat ? 'text-stone-400' : pct > 0 ? 'text-emerald-600' : 'text-red-600';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-stone-200/70 overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-stone-100">
        <h2 className="font-display font-semibold text-espresso text-sm">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const th = 'text-left px-5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap';
const thRight = 'text-right px-5 py-2.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap';
const td = 'px-5 py-2.5 text-sm text-espresso whitespace-nowrap';
const tdRight = 'px-5 py-2.5 text-sm text-espresso text-right whitespace-nowrap';

export default function AdminSalesPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/admin/sales?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setIsLoading(false);
      });
  }, [month]);

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const kpiRows = report
    ? ([
        ['Gross Sales', report.summary.grossSales, formatCurrency],
        ['Net Sales', report.summary.netSales, formatCurrency],
        ['Total Orders / Transaction Count', report.summary.totalOrders, (n: number) => n.toString()],
        ['Units Sold', report.summary.unitsSold, (n: number) => n.toString()],
        ['Average Order Value', report.summary.avgOrderValue, formatCurrency],
        ['Gross Profit', report.summary.grossProfit, formatCurrency],
        ['New Customer Sign-ups', report.summary.newCustomers, (n: number) => n.toString()],
      ] as const)
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-espresso">Sales Summary</h1>
          <p className="text-stone-500 text-sm mt-1">Monthly performance report</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-espresso w-36 text-center">
            {report?.monthLabel || '—'}
          </span>
          <button onClick={() => shiftMonth(1)} className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading || !report ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* 1. Sales Summary */}
          <SectionCard title="1. Sales Summary">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={th}>Key Performance Indicator</th>
                  <th className={thRight}>Current Month</th>
                  <th className={thRight}>Previous Month</th>
                  <th className={thRight}>Growth %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {kpiRows.map(([label, metric, fmt]) => (
                  <tr key={label} className="hover:bg-stone-50/60">
                    <td className={td}>{label}</td>
                    <td className={tdRight + ' font-semibold'}>{fmt(metric.current)}</td>
                    <td className={tdRight + ' text-espresso/50'}>{fmt(metric.previous)}</td>
                    <td className="px-5 py-2.5 text-right"><GrowthBadge pct={metric.growthPct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          {/* 2. Daily Sales Monitoring */}
          <SectionCard title="2. Daily Website Sales Monitoring">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={th}>Date</th>
                  <th className={thRight}>Orders</th>
                  <th className={thRight}>Units Sold</th>
                  <th className={thRight}>Gross Sales</th>
                  <th className={thRight}>Discounts</th>
                  <th className={thRight}>Refunds</th>
                  <th className={thRight}>Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.dailySales.map((d) => (
                  <tr key={d.date} className="hover:bg-stone-50/60">
                    <td className={td}>{d.date}</td>
                    <td className={tdRight}>{d.orders}</td>
                    <td className={tdRight}>{d.unitsSold}</td>
                    <td className={tdRight}>{formatCurrency(d.grossSales)}</td>
                    <td className={tdRight}>{formatCurrency(d.discounts)}</td>
                    <td className={tdRight}>{formatCurrency(d.refunds)}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(d.netSales)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50 border-t border-stone-200">
                <tr>
                  <td className={td + ' font-semibold'}>TOTAL</td>
                  <td className={tdRight + ' font-semibold'}>{report.dailySales.reduce((s, d) => s + d.orders, 0)}</td>
                  <td className={tdRight + ' font-semibold'}>{report.dailySales.reduce((s, d) => s + d.unitsSold, 0)}</td>
                  <td className={tdRight + ' font-semibold'}>{formatCurrency(report.dailySales.reduce((s, d) => s + d.grossSales, 0))}</td>
                  <td className={tdRight + ' font-semibold'}>{formatCurrency(report.dailySales.reduce((s, d) => s + d.discounts, 0))}</td>
                  <td className={tdRight + ' font-semibold'}>{formatCurrency(report.dailySales.reduce((s, d) => s + d.refunds, 0))}</td>
                  <td className={tdRight + ' font-bold text-primary-700'}>{formatCurrency(report.dailySales.reduce((s, d) => s + d.netSales, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </SectionCard>

          {/* 3. Sales by Brand */}
          <SectionCard title="3. Sales by Luxury Brand">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={th}>Brand</th>
                  <th className={thRight}>Units Sold</th>
                  <th className={thRight}>Total Sales</th>
                  <th className={thRight}>Gross Profit</th>
                  <th className={thRight}>Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.salesByBrand.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-stone-400">No sales this month</td></tr>
                ) : report.salesByBrand.map((b) => (
                  <tr key={b.brand} className="hover:bg-stone-50/60">
                    <td className={td}>{b.brand}</td>
                    <td className={tdRight}>{b.unitsSold}</td>
                    <td className={tdRight}>{formatCurrency(b.totalSales)}</td>
                    <td className={tdRight}>{formatCurrency(b.grossProfit)}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(b.netSales)}</td>
                  </tr>
                ))}
              </tbody>
              {report.salesByBrand.length > 0 && (
                <tfoot className="bg-stone-50 border-t border-stone-200">
                  <tr>
                    <td className={td + ' font-semibold'}>Total</td>
                    <td className={tdRight + ' font-semibold'}>{report.salesByBrand.reduce((s, b) => s + b.unitsSold, 0)}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(report.salesByBrand.reduce((s, b) => s + b.totalSales, 0))}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(report.salesByBrand.reduce((s, b) => s + b.grossProfit, 0))}</td>
                    <td className={tdRight + ' font-bold text-primary-700'}>{formatCurrency(report.salesByBrand.reduce((s, b) => s + b.netSales, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </SectionCard>

          {/* 4. Sales by Category */}
          <SectionCard title="4. Sales by Category">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={th}>Category</th>
                  <th className={thRight}>Units Sold</th>
                  <th className={thRight}>Total Sales</th>
                  <th className={thRight}>Gross Profit</th>
                  <th className={thRight}>Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.salesByCategory.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-stone-400">No sales this month</td></tr>
                ) : report.salesByCategory.map((c) => (
                  <tr key={c.category} className="hover:bg-stone-50/60">
                    <td className={td}>{c.category}</td>
                    <td className={tdRight}>{c.unitsSold}</td>
                    <td className={tdRight}>{formatCurrency(c.totalSales)}</td>
                    <td className={tdRight}>{formatCurrency(c.grossProfit)}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(c.netSales)}</td>
                  </tr>
                ))}
              </tbody>
              {report.salesByCategory.length > 0 && (
                <tfoot className="bg-stone-50 border-t border-stone-200">
                  <tr>
                    <td className={td + ' font-semibold'}>Total</td>
                    <td className={tdRight + ' font-semibold'}>{report.salesByCategory.reduce((s, c) => s + c.unitsSold, 0)}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(report.salesByCategory.reduce((s, c) => s + c.totalSales, 0))}</td>
                    <td className={tdRight + ' font-semibold'}>{formatCurrency(report.salesByCategory.reduce((s, c) => s + c.grossProfit, 0))}</td>
                    <td className={tdRight + ' font-bold text-primary-700'}>{formatCurrency(report.salesByCategory.reduce((s, c) => s + c.netSales, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </SectionCard>

          {/* 5. Website Traffic & Conversion */}
          <SectionCard title="5. Website Traffic & Conversion">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={th}>Metric</th>
                  <th className={thRight}>Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  ['Total Website Sessions', report.websiteTraffic.totalSessions],
                  ['Product Page Views', report.websiteTraffic.productPageViews],
                  ['Added to Cart', report.websiteTraffic.addedToCart],
                  ['Reached Checkout', report.websiteTraffic.reachedCheckout],
                  ['Completed Purchases', report.websiteTraffic.completedPurchases],
                  ['Website Conversion Rate', report.websiteTraffic.conversionRate],
                  ['Cart Abandonment Rate', report.websiteTraffic.cartAbandonmentRate],
                ].map(([label, value]) => (
                  <tr key={label as string} className="hover:bg-stone-50/60">
                    <td className={td}>{label}</td>
                    <td className={tdRight}>
                      {value === null ? (
                        <span className="text-stone-400 italic text-xs">Not tracked yet</span>
                      ) : (
                        value
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-xs text-stone-400 border-t border-stone-100">
              Session/pageview/cart analytics aren&apos;t instrumented on the storefront yet — only completed purchases are real data here.
            </p>
          </SectionCard>

          {/* 6. Inventory & Product Performance */}
          <SectionCard title="6. Inventory & Product Performance">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className={th}>Category</th>
                  <th className={thRight}>Available Units</th>
                  <th className={thRight}>Units Sold</th>
                  <th className={thRight}>Sales Revenue</th>
                  <th className={thRight}>Sell-through Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.inventoryPerformance.map((row) => (
                  <tr key={row.category} className="hover:bg-stone-50/60">
                    <td className={td}>{row.category}</td>
                    <td className={tdRight}>{row.availableUnits}</td>
                    <td className={tdRight}>{row.unitsSold}</td>
                    <td className={tdRight}>{formatCurrency(row.salesRevenue)}</td>
                    <td className={tdRight}>{row.sellThroughRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </>
      )}
    </div>
  );
}
