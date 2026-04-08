import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, products, notifications, paymentMethods } from '@/db/schema';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  // Build base query using relations
  if (session.user.role === 'CUSTOMER' || (!all && session.user.role !== 'ADMIN' && session.user.role !== 'SHIPPER')) {
    const ordersData = await db.query.orders.findMany({
      where: eq(orders.userId, session.user.id),
      with: {
        user: { columns: { id: true, name: true, email: true } },
        items: { with: { product: true } },
      },
      orderBy: desc(orders.createdAt),
    });
    return NextResponse.json(ordersData);
  }

  if (session.user.role === 'SHIPPER') {
    const ordersData = await db.query.orders.findMany({
      where: inArray(orders.status, ['CONFIRMED', 'SHIPPED']),
      with: {
        user: { columns: { id: true, name: true, email: true } },
        items: { with: { product: true } },
      },
      orderBy: desc(orders.createdAt),
    });
    return NextResponse.json(ordersData);
  }

  // ADMIN - all orders
  const ordersData = await db.query.orders.findMany({
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: { with: { product: true } },
    },
    orderBy: desc(orders.createdAt),
  });

  return NextResponse.json(ordersData);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { items, deliveryMethod, paymentMethodId, deliveryAddress } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 });
  }

  if (!deliveryMethod || !['LALAMOVE', 'SHOPEE', 'JNT'].includes(deliveryMethod)) {
    return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 });
  }

  if (deliveryMethod === 'LALAMOVE' && !deliveryAddress?.trim()) {
    return NextResponse.json({ error: 'Please provide a Lalamove delivery address' }, { status: 400 });
  }

  if (!paymentMethodId) {
    return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
  }

  const pmArr = await db.select().from(paymentMethods).where(eq(paymentMethods.id, paymentMethodId)).limit(1);
  const pm = pmArr[0];
  if (!pm || !pm.isActive) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  // Verify stock availability and calculate total
  let totalAmount = 0;
  const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

  for (const item of items) {
    const productArr = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    const product = productArr[0];

    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
    }

    // Pasabuy items are sourced on-demand — no stock check needed
    if (product.type !== 'PASABUY') {
      const availableStock = product.stock - product.reserved;
      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${availableStock}` },
          { status: 400 }
        );
      }
    }

    totalAmount += product.price * item.quantity;
    orderItemsData.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      isPasabuy: product.type === 'PASABUY',
    });
  }

  // Create order with 24-hour reservation
  const reservationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const newOrderArr = await db.insert(orders).values({
    userId: session.user.id,
    deliveryMethod,
    paymentMethodId: pm.id,
    paymentMethodName: pm.name,
    deliveryAddress: deliveryAddress?.trim() || null,
    totalAmount,
    reservationExpiry,
    status: 'PENDING_DEPOSIT',
  }).returning();
  const order = newOrderArr[0];

  // Insert order items
  for (const item of orderItemsData) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    });
  }

  // Reserve stock for on-hand items only (pasabuy items are sourced on-demand)
  for (const item of orderItemsData) {
    if (!item.isPasabuy) {
      await db.update(products)
        .set({ reserved: sql`${products.reserved} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  }

  // Create notifications
  await db.insert(notifications).values({
    title: 'New Order Placed',
    message: `Order #${order.id.slice(-8).toUpperCase()} placed by ${session.user.name}. Total: ₱${totalAmount.toFixed(2)}`,
    type: 'ORDER',
  });

  await db.insert(notifications).values({
    userId: session.user.id,
    title: 'Order Confirmed',
    message: `Your order #${order.id.slice(-8).toUpperCase()} has been placed. Please submit deposit proof within 24 hours.`,
    type: 'ORDER',
  });

  // Return order with items and products
  const fullOrder = await db.query.orders.findFirst({
    where: eq(orders.id, order.id),
    with: {
      items: { with: { product: true } },
    },
  });

  return NextResponse.json(fullOrder, { status: 201 });
}
