import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, orderStatusHistory, products, notifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Statuses where on-hand stock is only held in `reserved` (not yet deducted)
const RESERVED_ONLY = ['PENDING_DEPOSIT', 'DEPOSIT_SUBMITTED', 'SALES_ORDER', 'WAITING_FOR_ARRIVAL'];
// Statuses where payment was confirmed and stock was actually deducted
const STOCK_DEDUCTED = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];

// Permanently removes an order and puts everything it touched back the way it was:
// reserved/deducted inventory returns to the product, and the order's items,
// status history, notifications and invoice (which is generated from the order)
// all go with it. Cancelled orders already released their reservation.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
    with: { items: { with: { product: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // A mixed on-hand + personal-shopping order never deducts stock on confirm,
  // so its on-hand items are still just reserved even once confirmed.
  const hasPasabuy = order.items.some((i) => i.product.type === 'PASABUY');
  const reverted: { product: string; quantity: number; effect: 'released reservation' | 'restored stock' }[] = [];

  for (const item of order.items) {
    // Personal-shopping items are sourced on demand and never touch inventory
    if (item.product.type === 'PASABUY' || order.status === 'CANCELLED') continue;

    if (RESERVED_ONLY.includes(order.status) || (hasPasabuy && STOCK_DEDUCTED.includes(order.status))) {
      await db.update(products)
        .set({ reserved: sql`GREATEST(${products.reserved} - ${item.quantity}, 0)` })
        .where(eq(products.id, item.productId));
      reverted.push({ product: item.product.name, quantity: item.quantity, effect: 'released reservation' });
    } else if (STOCK_DEDUCTED.includes(order.status)) {
      await db.update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
      reverted.push({ product: item.product.name, quantity: item.quantity, effect: 'restored stock' });
    }
  }

  // Notifications reference the order as "#<last 8 chars of id>"
  const ref = order.id.slice(-8).toUpperCase();
  await db.delete(notifications).where(sql`${notifications.message} LIKE ${'%#' + ref + '%'}`);
  await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id));
  await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
  await db.delete(orders).where(eq(orders.id, order.id));

  return NextResponse.json({ success: true, reverted });
}
