import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productArr = await db.select().from(products).where(eq(products.id, params.id)).limit(1);
  const product = productArr[0];

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // costPrice is internal margin data — only ever returned to an admin session.
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === 'ADMIN';
  if (!isAdmin) {
    const { costPrice, ...rest } = product;
    return NextResponse.json(rest);
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    name, description, price, stock, category, itemType, imageUrl, type, etaStart, etaEnd,
    model, subcategory, color, dimension, size, hardware, stamp, authenticated, costPrice, inclusions,
  } = body;

  const updatedArr = await db.update(products).set({
    name,
    description,
    price: parseFloat(price),
    stock: parseInt(stock),
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
  }).where(eq(products.id, params.id)).returning();
  const product = updatedArr[0];

  // Check if low stock
  if (product.stock < 5) {
    await db.insert(notifications).values({
      title: 'Low Stock Alert',
      message: `Product "${product.name}" has low stock (${product.stock} remaining)`,
      type: 'WARNING',
    });
  }

  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.delete(products).where(eq(products.id, params.id));

  return NextResponse.json({ success: true });
}
