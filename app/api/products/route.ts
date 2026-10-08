import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productImages } from '@/db/schema';
import { eq, gt, or, ilike, desc, asc, sql } from 'drizzle-orm';

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

  // costPrice is internal margin data — only ever returned to an admin session.
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === 'ADMIN';
  const shaped = isAdmin ? result : result.map(({ costPrice, ...rest }) => rest);

  return NextResponse.json(shaped);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    name, description, price, stock, category, itemType, imageUrl, type, etaStart, etaEnd,
    model, subcategory, color, dimension, size, hardware, stamp, authenticated, costPrice, inclusions,
    images,
  } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const skuResult = await db.execute<{ sku: string }>(sql`SELECT 'HG-' || lpad(nextval('product_sku_seq')::text, 6, '0') AS sku`);
  const sku = skuResult[0]?.sku;

  const newProductArr = await db.insert(products).values({
    name,
    sku,
    description,
    price: parseFloat(price),
    stock: parseInt(stock) || 0,
    category,
    itemType: itemType || null,
    imageUrl,
    type: type === 'PASABUY' ? 'PASABUY' : 'ONHAND',
    etaStart: etaStart ? new Date(etaStart) : null,
    etaEnd: etaEnd ? new Date(etaEnd) : null,
    model: model || null,
    subcategory: subcategory || null,
    color: color || null,
    dimension: dimension || null,
    size: size || null,
    hardware: hardware || null,
    stamp: stamp || null,
    authenticated: Boolean(authenticated),
    costPrice: costPrice !== undefined && costPrice !== '' ? parseFloat(costPrice) : null,
    inclusions: inclusions || null,
  }).returning();
  const product = newProductArr[0];

  if (Array.isArray(images) && images.length > 0) {
    await db.insert(productImages).values(
      images.map((url: string, i: number) => ({ productId: product.id, url, sortOrder: i }))
    );
  }

  return NextResponse.json(product, { status: 201 });
}
