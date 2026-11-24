import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const MAX_ROWS = 2000;

const text = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v).trim();
  return s === '' ? null : s;
};

const num = (v: unknown): number | null => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = parseFloat(String(v).replace(/[₱,\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

// Bulk create/update from the admin spreadsheet. A row with an existing SKU
// updates that product; a row without one is created with a fresh SKU. Rows are
// processed independently so one bad row doesn't block the rest.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS} per import)` }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? {};
    const rowNo = i + 2; // spreadsheet row, counting the header
    try {
      const name = text(r.name);
      const price = num(r.price);
      const costPrice = num(r.costPrice);
      const stock = num(r.stock);
      if (Number.isNaN(price) || Number.isNaN(costPrice) || Number.isNaN(stock)) {
        errors.push({ row: rowNo, error: 'Price, Cost Price and Stock must be numbers' });
        continue;
      }

      const values = {
        ...(name ? { name } : {}),
        description: text(r.description),
        category: text(r.category),
        itemType: text(r.itemType),
        model: text(r.model),
        subcategory: text(r.subcategory),
        color: text(r.color),
        dimension: text(r.dimension),
        size: text(r.size),
        hardware: text(r.hardware),
        stamp: text(r.stamp),
        inclusions: text(r.inclusions),
        imageUrl: text(r.imageUrl),
        type: String(r.type ?? '').trim().toUpperCase() === 'PASABUY' ? 'PASABUY' : 'ONHAND',
        authenticated: ['YES', 'TRUE', 'Y', '1'].includes(String(r.authenticated ?? '').trim().toUpperCase()),
        costPrice,
        ...(price !== null ? { price } : {}),
        ...(stock !== null ? { stock: Math.max(0, Math.round(stock)) } : {}),
      };

      const sku = text(r.sku);
      if (sku) {
        const existing = await db.select({ id: products.id }).from(products).where(eq(products.sku, sku)).limit(1);
        if (existing[0]) {
          await db.update(products).set(values).where(eq(products.id, existing[0].id));
          updated++;
          continue;
        }
      }

      if (!name || price === null) {
        errors.push({ row: rowNo, error: sku ? `SKU ${sku} not found — new products need a Name and Price` : 'New products need a Name and Price' });
        continue;
      }

      const skuResult = await db.execute<{ sku: string }>(sql`SELECT 'HG-' || lpad(nextval('product_sku_seq')::text, 6, '0') AS sku`);
      await db.insert(products).values({ ...values, name, price, sku: skuResult[0]?.sku });
      created++;
    } catch (e) {
      errors.push({ row: rowNo, error: e instanceof Error ? e.message : 'Unexpected error' });
    }
  }

  return NextResponse.json({ created, updated, failed: errors.length, errors: errors.slice(0, 50) });
}
