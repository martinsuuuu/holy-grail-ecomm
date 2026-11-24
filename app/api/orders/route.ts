import { DELIVERY_VALUES, deliveryLabel } from '@/lib/delivery';
import { sendOrderPlacedEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, products, notifications, paymentMethods, promoCodes, orderStatusHistory } from '@/db/schema';
import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';
import { isEmailAllowedForPromo } from '@/lib/promoCodes';

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
        user: { columns: { id: true, customerId: true, name: true, email: true, phone: true } },
        items: { with: { product: true } },
        statusHistory: { orderBy: asc(orderStatusHistory.createdAt) },
      },
      orderBy: desc(orders.createdAt),
    });
    return NextResponse.json(ordersData);
  }

  if (session.user.role === 'SHIPPER') {
    const ordersData = await db.query.orders.findMany({
      where: inArray(orders.status, ['CONFIRMED', 'SHIPPED']),
      with: {
        user: { columns: { id: true, customerId: true, name: true, email: true, phone: true } },
        items: { with: { product: true } },
        statusHistory: { orderBy: asc(orderStatusHistory.createdAt) },
      },
      orderBy: desc(orders.createdAt),
    });
    return NextResponse.json(ordersData);
  }

  // ADMIN - all orders
  const ordersData = await db.query.orders.findMany({
    with: {
      user: { columns: { id: true, customerId: true, name: true, email: true, phone: true } },
      items: { with: { product: true } },
      statusHistory: { orderBy: asc(orderStatusHistory.createdAt) },
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
  const { items, deliveryMethod, paymentMethodId, deliveryAddress, promoCode } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in order' }, { status: 400 });
  }

  if (!deliveryMethod || !DELIVERY_VALUES.includes(deliveryMethod)) {
    return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 });
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
  const pasabuyProductIds = new Set<string>();

  for (const item of items) {
    const productArr = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    const product = productArr[0];

    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
    }

    const isPasabuy = product.type === 'PASABUY';
    if (isPasabuy) pasabuyProductIds.add(product.id);

    // Pasabuy items are sourced on-demand — no stock check needed
    if (!isPasabuy) {
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
    });
  }

  // Re-validate promo code server-side — never trust a client-supplied discount amount
  let appliedPromoCode: string | null = null;
  let discountAmount = 0;

  if (promoCode?.trim()) {
    const promoArr = await db.select().from(promoCodes).where(eq(promoCodes.code, promoCode.trim().toUpperCase())).limit(1);
    const promo = promoArr[0];
    const isValid = promo && promo.isActive && (!promo.expiresAt || new Date(promo.expiresAt) >= new Date())
      && isEmailAllowedForPromo(promo.allowedEmails, session.user.email);

    // An invalid/expired code at submission time is ignored rather than blocking checkout —
    // this can legitimately happen if an admin deactivates a code between validation and order placement.
    if (isValid) {
      const rawDiscount = promo.type === 'PERCENT' ? (totalAmount * promo.value) / 100 : promo.value;
      discountAmount = Math.min(Math.max(rawDiscount, 0), totalAmount);
      appliedPromoCode = promo.code;
    }
  }

  totalAmount = Math.max(totalAmount - discountAmount, 0);

  // BDO Checkout needs staff to upload a QR for this order before the customer can pay,
  // so the 24-hour deposit window only starts once the QR is ready (see PATCH /api/orders/[id]).
  const awaitingQr = pm.type === 'BDO_CHECKOUT';
  const reservationExpiry = awaitingQr
    ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const newOrderArr = await db.insert(orders).values({
    userId: session.user.id,
    deliveryMethod,
    paymentMethodId: pm.id,
    paymentMethodName: pm.name,
    deliveryAddress: deliveryAddress?.trim() || null,
    totalAmount,
    promoCode: appliedPromoCode,
    discountAmount,
    reservationExpiry,
    status: awaitingQr ? 'AWAITING_QR' : 'PENDING_DEPOSIT',
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
    if (!pasabuyProductIds.has(item.productId)) {
      await db.update(products)
        .set({ reserved: sql`${products.reserved} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  }

  // Create notifications
  await db.insert(notifications).values({
    title: 'New Order Placed',
    message: `Order #${order.id.slice(-8).toUpperCase()} placed by ${session.user.name}. Total: ₱${totalAmount.toFixed(2)}${awaitingQr ? ' — BDO Checkout: upload the payment QR.' : ''}`,
    type: 'ORDER',
  });

  await db.insert(notifications).values({
    userId: session.user.id,
    title: 'Order Confirmed',
    message: awaitingQr
      ? `Your order #${order.id.slice(-8).toUpperCase()} has been placed. We're preparing your BDO Checkout QR — you'll be notified as soon as it's ready to scan.`
      : `Your order #${order.id.slice(-8).toUpperCase()} has been placed. Please submit deposit proof within 24 hours.`,
    type: 'ORDER',
  });

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    status: order.status,
    note: awaitingQr ? 'Order placed by customer — waiting for BDO Checkout QR' : 'Order placed by customer',
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? 'Customer',
    actorRole: session.user.role,
  });

  // Return order with items and products
  const fullOrder = await db.query.orders.findFirst({
    where: eq(orders.id, order.id),
    with: {
      items: { with: { product: true } },
      statusHistory: { orderBy: asc(orderStatusHistory.createdAt) },
    },
  });

  // Receipt email — a mail problem must never fail an order that's already been placed
  if (fullOrder && session.user.email) {
    try {
      await sendOrderPlacedEmail({
        to: session.user.email,
        name: session.user.name ?? 'there',
        orderRef: order.id.slice(-8).toUpperCase(),
        items: fullOrder.items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
        discountAmount,
        promoCode: appliedPromoCode,
        total: totalAmount,
        deliveryLabel: deliveryLabel(deliveryMethod),
        paymentMethodName: pm.name,
        depositDeadline: reservationExpiry,
        // Orders that include sourced (pasabuy) pieces come from the sourcing mailbox
        awaitingQr,
        channel: pasabuyProductIds.size > 0 ? 'sourcing' : 'default',
      });
    } catch (e) {
      console.error('[email] order placed email failed', e);
    }
  }

  return NextResponse.json(fullOrder, { status: 201 });
}
