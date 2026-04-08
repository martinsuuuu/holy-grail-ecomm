import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { purchaseOrders, products, expenses, notifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const purchaseOrder = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, params.id),
    with: { items: true },
  });

  if (!purchaseOrder) {
    return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
  }

  if (purchaseOrder.status === 'RECEIVED') {
    return NextResponse.json({ error: 'Order already received' }, { status: 400 });
  }

  // Update inventory for each item
  for (const item of purchaseOrder.items) {
    await db.update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  await db.update(purchaseOrders)
    .set({ status: 'RECEIVED', receivedAt: new Date() })
    .where(eq(purchaseOrders.id, params.id));

  // Add expense for the purchase
  await db.insert(expenses).values({
    title: `Purchase Order - ${purchaseOrder.supplier}`,
    category: 'Inventory',
    amount: purchaseOrder.totalCost,
    date: new Date(),
    notes: `Auto-generated from PO #${purchaseOrder.id.slice(-8).toUpperCase()}`,
  });

  await db.insert(notifications).values({
    title: 'Purchase Order Received',
    message: `Purchase order from ${purchaseOrder.supplier} has been received. Inventory updated.`,
    type: 'INFO',
  });

  const updatedOrder = await db.query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, params.id),
    with: {
      items: { with: { product: true } },
    },
  });

  return NextResponse.json(updatedOrder);
}
