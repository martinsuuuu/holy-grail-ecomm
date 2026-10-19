import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';
import { pesos } from './pdfUtils';
import type { SalesReport } from './salesReport';

function statusLabel(pct: number | null) {
  if (pct === null) return 'New';
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function kpiRows(report: SalesReport) {
  return [
    ['Gross Sales', report.summary.grossSales],
    ['Net Sales', report.summary.netSales],
    ['Total Orders / Transaction Count', report.summary.totalOrders],
    ['Units Sold', report.summary.unitsSold],
    ['Average Order Value', report.summary.avgOrderValue],
    ['Gross Profit', report.summary.grossProfit],
    ['New Customer Sign-ups', report.summary.newCustomers],
  ] as const;
}

const TRAFFIC_ROWS = (report: SalesReport) => [
  ['Total Website Sessions', report.websiteTraffic.totalSessions],
  ['Product Page Views', report.websiteTraffic.productPageViews],
  ['Added to Cart', report.websiteTraffic.addedToCart],
  ['Reached Checkout', report.websiteTraffic.reachedCheckout],
  ['Completed Purchases', report.websiteTraffic.completedPurchases],
  ['Website Conversion Rate', report.websiteTraffic.conversionRate],
  ['Cart Abandonment Rate', report.websiteTraffic.cartAbandonmentRate],
];

function fileBaseName(report: SalesReport) {
  return `sales-summary_${report.from}_to_${report.to}`;
}

// Whole numbers (orders, units) vs. currency fields get different formatting
// — the KPI rows mix both, so each row carries its own formatter.
function isCurrencyKpi(label: string) {
  return label !== 'Total Orders / Transaction Count' && label !== 'Units Sold' && label !== 'New Customer Sign-ups';
}

export function exportSalesToExcel(report: SalesReport) {
  const rows: (string | number)[][] = [];
  rows.push(['HOLY GRAIL — Sales Summary']);
  rows.push([report.rangeLabel]);
  rows.push([]);

  rows.push(['1. Sales Summary']);
  rows.push(['Key Performance Indicator', 'Selected Period', 'Previous Period', 'Growth %']);
  for (const [label, metric] of kpiRows(report)) {
    const fmt = isCurrencyKpi(label) ? formatCurrency : (n: number) => n.toString();
    rows.push([label, fmt(metric.current), fmt(metric.previous), statusLabel(metric.growthPct)]);
  }
  rows.push([]);

  rows.push(['2. Daily Website Sales Monitoring']);
  rows.push(['Date', 'Orders', 'Units Sold', 'Gross Sales', 'Discounts', 'Refunds', 'Net Sales']);
  for (const d of report.dailySales) {
    rows.push([d.date, d.orders, d.unitsSold, formatCurrency(d.grossSales), formatCurrency(d.discounts), formatCurrency(d.refunds), formatCurrency(d.netSales)]);
  }
  rows.push([
    'TOTAL',
    report.dailySales.reduce((s, d) => s + d.orders, 0),
    report.dailySales.reduce((s, d) => s + d.unitsSold, 0),
    formatCurrency(report.dailySales.reduce((s, d) => s + d.grossSales, 0)),
    formatCurrency(report.dailySales.reduce((s, d) => s + d.discounts, 0)),
    formatCurrency(report.dailySales.reduce((s, d) => s + d.refunds, 0)),
    formatCurrency(report.dailySales.reduce((s, d) => s + d.netSales, 0)),
  ]);
  rows.push([]);

  rows.push(['3. Sales by Luxury Brand']);
  rows.push(['Brand', 'Units Sold', 'Total Sales', 'Gross Profit', 'Net Sales']);
  for (const b of report.salesByBrand) {
    rows.push([b.brand, b.unitsSold, formatCurrency(b.totalSales), formatCurrency(b.grossProfit), formatCurrency(b.netSales)]);
  }
  rows.push([]);

  rows.push(['4. Sales by Category']);
  rows.push(['Category', 'Units Sold', 'Total Sales', 'Gross Profit', 'Net Sales']);
  for (const c of report.salesByCategory) {
    rows.push([c.category, c.unitsSold, formatCurrency(c.totalSales), formatCurrency(c.grossProfit), formatCurrency(c.netSales)]);
  }
  rows.push([]);

  rows.push(['5. Website Traffic & Conversion']);
  rows.push(['Metric', 'Result']);
  for (const [label, value] of TRAFFIC_ROWS(report)) {
    rows.push([label as string, value === null ? 'Not tracked yet' : (value as number)]);
  }
  rows.push([]);

  rows.push(['6. Inventory & Product Performance']);
  rows.push(['Category', 'Available Units', 'Units Sold', 'Sales Revenue', 'Sell-through Rate']);
  for (const row of report.inventoryPerformance) {
    rows.push([row.category, row.availableUnits, row.unitsSold, formatCurrency(row.salesRevenue), `${row.sellThroughRate.toFixed(1)}%`]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'SALES REPORT');
  XLSX.writeFile(workbook, `${fileBaseName(report)}.xlsx`);
}

export function exportSalesToPdf(report: SalesReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 36;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HOLY GRAIL — Sales Summary', marginX, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(report.rangeLabel, marginX, 60);

  let y = 80;
  const pageHeight = doc.internal.pageSize.getHeight();
  const sectionTitle = (title: string) => {
    // autoTable paginates its own tables automatically, but this manual
    // text isn't page-aware — start a fresh page if a title would otherwise
    // land right at (or past) the bottom margin.
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 40;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(title, marginX, y);
    y += 8;
  };
  const afterTable = () => {
    y = (doc as any).lastAutoTable.finalY + 22;
  };

  sectionTitle('1. Sales Summary');
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Key Performance Indicator', 'Selected Period', 'Previous Period', 'Growth %']],
    body: kpiRows(report).map(([label, metric]) => {
      const fmt = isCurrencyKpi(label) ? pesos : (n: number) => n.toString();
      return [label, fmt(metric.current), fmt(metric.previous), statusLabel(metric.growthPct)];
    }),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [11, 61, 46] },
  });
  afterTable();

  sectionTitle('2. Daily Website Sales Monitoring');
  const dailyTotals = [
    'TOTAL',
    report.dailySales.reduce((s, d) => s + d.orders, 0),
    report.dailySales.reduce((s, d) => s + d.unitsSold, 0),
    pesos(report.dailySales.reduce((s, d) => s + d.grossSales, 0)),
    pesos(report.dailySales.reduce((s, d) => s + d.discounts, 0)),
    pesos(report.dailySales.reduce((s, d) => s + d.refunds, 0)),
    pesos(report.dailySales.reduce((s, d) => s + d.netSales, 0)),
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Date', 'Orders', 'Units Sold', 'Gross Sales', 'Discounts', 'Refunds', 'Net Sales']],
    body: report.dailySales.map((d) => [d.date, d.orders, d.unitsSold, pesos(d.grossSales), pesos(d.discounts), pesos(d.refunds), pesos(d.netSales)]),
    foot: [dailyTotals],
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 61, 46] },
    footStyles: { fillColor: [230, 230, 230], textColor: [20, 20, 20], fontStyle: 'bold' },
  });
  afterTable();

  sectionTitle('3. Sales by Luxury Brand');
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Brand', 'Units Sold', 'Total Sales', 'Gross Profit', 'Net Sales']],
    body: report.salesByBrand.length
      ? report.salesByBrand.map((b) => [b.brand, b.unitsSold, pesos(b.totalSales), pesos(b.grossProfit), pesos(b.netSales)])
      : [['No sales in this period', '', '', '', '']],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [11, 61, 46] },
  });
  afterTable();

  sectionTitle('4. Sales by Category');
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Category', 'Units Sold', 'Total Sales', 'Gross Profit', 'Net Sales']],
    body: report.salesByCategory.length
      ? report.salesByCategory.map((c) => [c.category, c.unitsSold, pesos(c.totalSales), pesos(c.grossProfit), pesos(c.netSales)])
      : [['No sales in this period', '', '', '', '']],
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [11, 61, 46] },
  });
  afterTable();

  sectionTitle('5. Website Traffic & Conversion');
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Metric', 'Result']],
    body: TRAFFIC_ROWS(report).map(([label, value]) => [label as string, value === null ? 'Not tracked yet' : String(value)]),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [11, 61, 46] },
  });
  afterTable();

  sectionTitle('6. Inventory & Product Performance');
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Category', 'Available Units', 'Units Sold', 'Sales Revenue', 'Sell-through Rate']],
    body: report.inventoryPerformance.map((row) => [row.category, row.availableUnits, row.unitsSold, pesos(row.salesRevenue), `${row.sellThroughRate.toFixed(1)}%`]),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [11, 61, 46] },
  });

  doc.save(`${fileBaseName(report)}.pdf`);
}
