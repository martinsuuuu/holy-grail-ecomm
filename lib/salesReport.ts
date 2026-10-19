export interface SalesMetric {
  current: number;
  previous: number;
  growthPct: number | null;
}

export interface SalesGroupRow {
  unitsSold: number;
  totalSales: number;
  grossProfit: number;
  netSales: number;
}

export interface SalesReport {
  from: string;
  to: string;
  rangeLabel: string;
  summary: {
    grossSales: SalesMetric;
    netSales: SalesMetric;
    totalOrders: SalesMetric;
    unitsSold: SalesMetric;
    avgOrderValue: SalesMetric;
    grossProfit: SalesMetric;
    newCustomers: SalesMetric;
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
  salesByBrand: Array<SalesGroupRow & { brand: string }>;
  salesByCategory: Array<SalesGroupRow & { category: string }>;
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
