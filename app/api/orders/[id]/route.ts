import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, products, notifications, paymentMethods } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: { with: { product: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Customers can only view their own orders
  if (session.user.role === 'CUSTOMER' && order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Include payment method details so customer can reference them for payment
  let paymentMethod = null;
  if (order.paymentMethodId) {
    const pmArr = await db.select().from(paymentMethods).where(eq(paymentMethods.id, order.paymentMethodId)).limit(1);
    paymentMethod = pmArr[0] ?? null;
  }

  return NextResponse.json({ ...order, paymentMethod });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { status, depositConfirmed } = body;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
    with: { items: { with: { product: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const hasPasabuyItems = order.items.some(item => item.product.type === 'PASABUY');

  const updateData: Partial<typeof orders.$inferInsert> = {};

  // Admin can update order status and confirm deposit
  let pendingNotification: { userId: string; title: string; message: string; type: string } | null = null;
  let deductStock = false;
  // On-hand items reserve stock at order creation (see POST /api/orders) and
  // release it either on confirm (deductStock, below) or here on cancel —
  // otherwise a cancelled order's reservation is never returned to the pool.
  let releaseReserved = false;

  if (session.user.role === 'ADMIN') {
    if (status) {
      updateData.status = status;

      // When admin confirms arrival of pasabuy items (WAITING_FOR_ARRIVAL → CONFIRMED)
      if (status === 'CONFIRMED' && order.status === 'WAITING_FOR_ARRIVAL') {
        pendingNotification = {
          userId: order.userId,
          title: 'Items Arrived!',
          message: `Great news! Your pasabuy items for order #${order.id.slice(-8).toUpperCase()} have arrived and your order is now confirmed.`,
          type: 'ORDER',
        };
      }

      if (status === 'CANCELLED' && (order.status === 'PENDING_DEPOSIT' || order.status === 'DEPOSIT_SUBMITTED')) {
        releaseReserved = true;
      }
    }

    if (depositConfirmed !== undefined) {
      updateData.depositConfirmed = depositConfirmed;
      if (depositConfirmed) {
        if (hasPasabuyItems) {
          // Pasabuy orders wait for physical arrival before being fully confirmed
          updateData.status = 'WAITING_FOR_ARRIVAL';
          pendingNotification = {
            userId: order.userId,
            title: 'Deposit Confirmed',
            message: `Your deposit for order #${order.id.slice(-8).toUpperCase()} has been confirmed. Your pasabuy items are being sourced — we'll notify you when they arrive!`,
            type: 'ORDER',
          };
        } else {
          // Regular on-hand order — confirm immediately and deduct stock
          updateData.status = 'CONFIRMED';
          deductStock = true;
          pendingNotification = {
            userId: order.userId,
            title: 'Deposit Confirmed',
            message: `Your deposit for order #${order.id.slice(-8).toUpperCase()} has been confirmed. Your order is being processed.`,
            type: 'ORDER',
          };
        }
      }
    }
  }

  // Shipper can mark as shipped
  if (session.user.role === 'SHIPPER') {
    if (status === 'SHIPPED') {
      updateData.status = 'SHIPPED';
      updateData.shippedAt = new Date();
      pendingNotification = {
        userId: order.userId,
        title: 'Order Shipped',
        message: `Your order #${order.id.slice(-8).toUpperCase()} has been shipped!`,
        type: 'ORDER',
      };
    }
  }

  // Update order status FIRST so it always persists regardless of notification failures
  await db.update(orders).set(updateData).where(eq(orders.id, params.id));

  // Deduct stock after status is saved
  if (deductStock) {
    for (const item of order.items) {
      await db.update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          reserved: sql`${products.reserved} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }
  }

  // Cancelling before confirmation returns the reservation (stock itself was
  // never touched at this point, so only `reserved` needs to come back down).
  // Pasabuy items never incremented `reserved` in the first place — skip them.
  if (releaseReserved) {
    for (const item of order.items) {
      if (item.product.type === 'PASABUY') continue;
      await db.update(products)
        .set({ reserved: sql`${products.reserved} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  }

  // Insert notification after order update (non-blocking)
  if (pendingNotification) {
    try {
      await db.insert(notifications).values(pendingNotification);
    } catch {
      // Notification failure should not affect the order status update
    }
  }

  const updatedOrder = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: { with: { product: true } },
    },
  });

  return NextResponse.json(updatedOrder);
}
