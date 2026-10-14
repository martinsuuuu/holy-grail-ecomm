import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products, notifications } from '@/db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { isUnauthorizedCronRequest } from '@/lib/cronAuth';

export async function GET(request: NextRequest) {
  if (isUnauthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all expired PENDING_DEPOSIT orders
  const expiredOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.status, 'PENDING_DEPOSIT'),
      lt(orders.reservationExpiry, new Date())
    ),
    with: { items: true },
  });

  let cancelledCount = 0;

  for (const order of expiredOrders) {
    // Release reserved stock
    for (const item of order.items) {
      await db.update(products)
        .set({ reserved: sql`${products.reserved} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    // Cancel order
    await db.update(orders)
      .set({ status: 'CANCELLED' })
      .where(eq(orders.id, order.id));

    // Notify customer
    await db.insert(notifications).values({
      userId: order.userId,
      title: 'Order Cancelled',
      message: `Your order #${order.id.slice(-8).toUpperCase()} has been cancelled due to no deposit within 24 hours.`,
      type: 'WARNING',
    });

    cancelledCount++;
  }

  return NextResponse.json({
    success: true,
    cancelledOrders: cancelledCount,
    message: `Cancelled ${cancelledCount} expired orders`,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
