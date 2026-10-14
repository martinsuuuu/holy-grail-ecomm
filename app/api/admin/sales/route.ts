import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, users, products } from '@/db/schema';
import { inArray, and, gte, lte, eq } from 'drizzle-orm';
import { startOfMonth, endOfMonth, subMonths, eachDayOfInterval, format, parse, isValid } from 'date-fns';

const PAID_STATUSES = ['CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;

interface GroupTotals {
  unitsSold: number;
  totalSales: number;
  grossProfit: number;
  netSales: number;
}

function emptyGroupTotals(): GroupTotals {
  return { unitsSold: 0, totalSales: 0, grossProfit: 0, netSales: 0 };
}

async function loadMonthData(monthStart: Date, monthEnd: Date) {
  const ordersInRange = await db.query.orders.findMany({
    where: and(
      inArray(orders.status, PAID_STATUSES as unknown as string[]),
      gte(orders.createdAt, monthStart),
      lte(orders.createdAt, monthEnd)
    ),
    with: { items: { with: { product: true } } },
  });

  const newCustomers = await db.select().from(users).where(
    and(eq(users.role, 'CUSTOMER'), gte(users.createdAt, monthStart), lte(users.createdAt, monthEnd))
  );

  return { ordersInRange, newCustomerCount: newCustomers.length };
}

function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // null = "new" (no baseline to compare against)
  return ((current - previous) / previous) * 100;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month'); // 'yyyy-MM'
  const parsedMonth = monthParam ? parse(monthParam, 'yyyy-MM', new Date()) : new Date();
  const anchor = isValid(parsedMonth) ? parsedMonth : new Date();

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const prevMonthStart = startOfMonth(subMonths(anchor, 1));
  const prevMonthEnd = endOfMonth(subMonths(anchor, 1));

  const [current, previous] = await Promise.all([
    loadMonthData(monthStart, monthEnd),
    loadMonthData(prevMonthStart, prevMonthEnd),
  ]);

  // ---- 1. Sales Summary (this month vs. last month) ----
  const sum = (list: typeof current.ordersInRange) => {
    let gross = 0;
    let net = 0;
    let units = 0;
    let profit = 0;
    for (const order of list) {
      net += order.totalAmount;
      for (const item of order.items) {
        gross += item.price * item.quantity;
        units += item.quantity;
        const cost = item.product.costPrice ?? 0;
        profit += (item.price - cost) * item.quantity;
      }
    }
    return { gross, net, units, profit, orders: list.length };
  };
  const curSum = sum(current.ordersInRange);
  const prevSum = sum(previous.ordersInRange);

  const summary = {
    grossSales: { current: curSum.gross, previous: prevSum.gross, growthPct: growthPercent(curSum.gross, prevSum.gross) },
    netSales: { current: curSum.net, previous: prevSum.net, growthPct: growthPercent(curSum.net, prevSum.net) },
    totalOrders: { current: curSum.orders, previous: prevSum.orders, growthPct: growthPercent(curSum.orders, prevSum.orders) },
    unitsSold: { current: curSum.units, previous: prevSum.units, growthPct: growthPercent(curSum.units, prevSum.units) },
    avgOrderValue: {
      current: curSum.orders ? curSum.net / curSum.orders : 0,
      previous: prevSum.orders ? prevSum.net / prevSum.orders : 0,
      growthPct: growthPercent(
        curSum.orders ? curSum.net / curSum.orders : 0,
        prevSum.orders ? prevSum.net / prevSum.orders : 0
      ),
    },
    grossProfit: { current: curSum.profit, previous: prevSum.profit, growthPct: growthPercent(curSum.profit, prevSum.profit) },
    newCustomers: {
      current: current.newCustomerCount,
      previous: previous.newCustomerCount,
      growthPct: growthPercent(current.newCustomerCount, previous.newCustomerCount),
    },
  };

  // ---- 2. Daily Website Sales Monitoring ----
  const dayKeys = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((d) => format(d, 'yyyy-MM-dd'));
  const dailyMap = new Map<string, { orders: number; unitsSold: number; grossSales: number; discounts: number; refunds: number; netSales: number }>();
  for (const key of dayKeys) dailyMap.set(key, { orders: 0, unitsSold: 0, grossSales: 0, discounts: 0, refunds: 0, netSales: 0 });
  for (const order of current.ordersInRange) {
    const key = format(order.createdAt, 'yyyy-MM-dd');
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.discounts += order.discountAmount;
    bucket.netSales += order.totalAmount;
    for (const item of order.items) {
      bucket.unitsSold += item.quantity;
      bucket.grossSales += item.price * item.quantity;
    }
  }
  // `refunds` has no backing data — this store has no refund flow (orders
  // only get reserved then confirmed or cancelled pre-payment) — kept as a
  // real, honest zero rather than dropped, to match the report's columns.
  const dailySales = dayKeys.map((key) => ({ date: key, ...dailyMap.get(key)! }));

  // ---- 3 & 4. Sales by brand / by category ----
  const byBrand = new Map<string, GroupTotals>();
  const byCategory = new Map<string, GroupTotals>();
  for (const order of current.ordersInRange) {
    for (const item of order.items) {
      const brand = item.product.category || 'Unlabeled';
      const category = item.product.itemType || 'Unlabeled';
      const cost = item.product.costPrice ?? 0;
      const lineTotal = item.price * item.quantity;
      const lineProfit = (item.price - cost) * item.quantity;

      const brandTotals = byBrand.get(brand) || emptyGroupTotals();
      brandTotals.unitsSold += item.quantity;
      brandTotals.totalSales += lineTotal;
      brandTotals.grossProfit += lineProfit;
      brandTotals.netSales += lineTotal; // discounts apply at order level, not itemized per line
      byBrand.set(brand, brandTotals);

      const categoryTotals = byCategory.get(category) || emptyGroupTotals();
      categoryTotals.unitsSold += item.quantity;
      categoryTotals.totalSales += lineTotal;
      categoryTotals.grossProfit += lineProfit;
      categoryTotals.netSales += lineTotal;
      byCategory.set(category, categoryTotals);
    }
  }
  const salesByBrand = [...byBrand.entries()]
    .map(([brand, totals]) => ({ brand, ...totals }))
    .sort((a, b) => b.totalSales - a.totalSales);
  const salesByCategory = [...byCategory.entries()]
    .map(([category, totals]) => ({ category, ...totals }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // ---- 5. Website Traffic & Conversion — no analytics/session tracking exists
  // in this app yet, so only "Completed Purchases" is real data. The rest are
  // reported as `null` rather than invented numbers.
  const websiteTraffic = {
    totalSessions: null,
    productPageViews: null,
    addedToCart: null,
    reachedCheckout: null,
    completedPurchases: curSum.orders,
    conversionRate: null,
    cartAbandonmentRate: null,
  };

  // ---- 6. Inventory & Product Performance (by category/item type) ----
  const allProducts = await db.select().from(products);
  const stockByCategory = new Map<string, number>();
  for (const p of allProducts) {
    const category = p.itemType || 'Unlabeled';
    stockByCategory.set(category, (stockByCategory.get(category) || 0) + p.stock);
  }
  const inventoryPerformance = [...new Set([...stockByCategory.keys(), ...byCategory.keys()])]
    .map((category) => {
      const sold = byCategory.get(category) || emptyGroupTotals();
      const availableUnits = stockByCategory.get(category) || 0;
      const sellThroughRate = sold.unitsSold + availableUnits > 0
        ? (sold.unitsSold / (sold.unitsSold + availableUnits)) * 100
        : 0;
      return {
        category,
        availableUnits,
        unitsSold: sold.unitsSold,
        salesRevenue: sold.totalSales,
        sellThroughRate,
      };
    })
    .sort((a, b) => b.salesRevenue - a.salesRevenue);

  return NextResponse.json({
    month: format(monthStart, 'yyyy-MM'),
    monthLabel: format(monthStart, 'MMMM yyyy'),
    summary,
    dailySales,
    salesByBrand,
    salesByCategory,
    websiteTraffic,
    inventoryPerformance,
  });
}
