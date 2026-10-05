import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, products, users, notifications, orderStatusHistory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import { generateCustomerId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, newCustomer, items } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 });
  }

  // Resolve the customer this walk-in order is placed under — either an
  // existing account, or a new one created on the spot. A manual order still
  // needs a `users` row (orders.userId is NOT NULL) even for a one-off
  // walk-in, so we create a lightweight account with a random password the
  // customer never needs — it exists purely to hold the order record.
  let resolvedUserId: string;

  if (customerId) {
    const customerArr = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
    if (!customerArr[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }
    resolvedUserId = customerArr[0].id;
  } else if (newCustomer?.name?.trim()) {
    const email = newCustomer.email?.trim()
      ? newCustomer.email.trim().toLowerCase()
      : `walkin-${createId()}@holygrail.local`;

    const existingArr = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingArr[0]) {
      return NextResponse.json({ error: 'A customer with that email already exists — search for them instead' }, { status: 400 });
    }

    const randomPassword = createId() + createId();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUserArr = await db.insert(users).values({
      name: newCustomer.name.trim(),
      email,
      password: hashedPassword,
      phone: newCustomer.phone?.trim() || null,
      role: 'CUSTOMER',
      customerId: generateCustomerId(),
    }).returning();
    resolvedUserId = newUserArr[0].id;
  } else {
    return NextResponse.json({ error: 'Select an existing customer or provide a walk-in customer name' }, { status: 400 });
  }

  // Validate items against current stock — manual orders are for on-hand
  // items only (pasabuy items aren't physically available to hand over).
  let totalAmount = 0;
  const orderItemsData: { productId: string; quantity: number; price: number }[] = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return NextResponse.json({ error: 'Invalid item in order' }, { status: 400 });
    }

    const productArr = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    const product = productArr[0];

    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
    }

    if (product.type === 'PASABUY') {
      return NextResponse.json({ error: `${product.name} is a personal shopping item and has no available stock to hand over in-store` }, { status: 400 });
    }

    const availableStock = product.stock - product.reserved;
    if (availableStock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${product.name}. Available: ${availableStock}` },
        { status: 400 }
      );
    }

    totalAmount += product.price * item.quantity;
    orderItemsData.push({ productId: product.id, quantity: item.quantity, price: product.price });
  }

  // Walk-in orders are paid and handed over in person, so they're created
  // already confirmed — skip the online deposit-reservation workflow.
  const newOrderArr = await db.insert(orders).values({
    userId: resolvedUserId,
    deliveryMethod: 'WALK_IN',
    paymentMethodName: 'Walk-in (In-Store Payment)',
    depositConfirmed: true,
    totalAmount,
    reservationExpiry: new Date(),
    status: 'CONFIRMED',
  }).returning();
  const order = newOrderArr[0];

  for (const item of orderItemsData) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    });
  }

  for (const item of orderItemsData) {
    await db.update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    status: 'CONFIRMED',
    note: 'Manual order created for walk-in customer',
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? 'Admin',
    actorRole: session.user.role,
  });

  await db.insert(notifications).values({
    userId: resolvedUserId,
    title: 'Order Confirmed',
    message: `Your in-store order #${order.id.slice(-8).toUpperCase()} has been recorded. Total: ₱${totalAmount.toFixed(2)}`,
    type: 'ORDER',
  });

  const fullOrder = await db.query.orders.findFirst({
    where: eq(orders.id, order.id),
    with: {
      user: { columns: { id: true, name: true, email: true, customerId: true } },
      items: { with: { product: true } },
      statusHistory: true,
    },
  });

  return NextResponse.json(fullOrder, { status: 201 });
}
