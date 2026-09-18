import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, notifications } from '@/db/schema';
import { eq, gt, or, ilike, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const itemType = searchParams.get('itemType');
  const search = searchParams.get('search');
  const inStockOnly = searchParams.get('inStockOnly') === 'true';
  const sort = searchParams.get('sort'); // 'price_asc' | 'price_desc'

  let query = db.select().from(products).$dynamic();

  const conditions = [];

  if (category && category !== 'all') {
    conditions.push(eq(products.category, category));
  }

  if (itemType && itemType !== 'all') {
    conditions.push(eq(products.itemType, itemType));
  }

  if (search) {
    conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`))!);
  }

  if (inStockOnly) {
    conditions.push(gt(products.stock, 0));
  }

  if (conditions.length > 0) {
    const { and } = await import('drizzle-orm');
    query = query.where(and(...conditions));
  }

  const orderBy = sort === 'price_asc'
    ? asc(products.price)
    : sort === 'price_desc'
    ? desc(products.price)
    : desc(products.createdAt);

  const result = await query.orderBy(orderBy);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, price, stock, category, itemType, imageUrl, type, etaStart, etaEnd } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const newProductArr = await db.insert(products).values({
    name,
    description,
    price: parseFloat(price),
    stock: parseInt(stock) || 0,
    category,
    itemType: itemType || null,
    imageUrl,
    type: type === 'PASABUY' ? 'PASABUY' : 'ONHAND',
    etaStart: etaStart ? new Date(etaStart) : null,
    etaEnd: etaEnd ? new Date(etaEnd) : null,
  }).returning();
  const product = newProductArr[0];

  // Check if low stock
  if (product.stock < 5) {
    await db.insert(notifications).values({
      title: 'Low Stock Alert',
      message: `Product "${product.name}" has low stock (${product.stock} remaining)`,
      type: 'WARNING',
    });
  }

  return NextResponse.json(product, { status: 201 });
}
