import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, products, notifications, paymentMethods, orderStatusHistory, users } from '@/db/schema';
import { eq, sql, asc } from 'drizzle-orm';
import { sendBdoQrReadyEmail, sendOrderPaidEmail, sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/email';
import { deliveryLabel } from '@/lib/delivery';

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
      user: { columns: { id: true, customerId: true, name: true, email: true, phone: true } },
      items: { with: { product: true } },
      statusHistory: { orderBy: asc(orderStatusHistory.createdAt) },
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
  const { status, depositConfirmed, paymentQr } = body;

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
  let historyNote: string | null = null;
  let deductStock = false;
  // On-hand items reserve stock at order creation (see POST /api/orders) and
  // release it either on confirm (deductStock, below) or here on cancel —
  // otherwise a cancelled order's reservation is never returned to the pool.
  let releaseReserved = false;
  let qrReleased = false;

  if (session.user.role === 'ADMIN') {
    if (status) {
      updateData.status = status;

      // When admin confirms arrival of pasabuy items (WAITING_FOR_ARRIVAL → CONFIRMED)
      if (status === 'CONFIRMED' && order.status === 'WAITING_FOR_ARRIVAL') {
        pendingNotification = {
          userId: order.userId,
          title: 'Items Arrived!',
          message: `Great news! Your personal shopping items for order #${order.id.slice(-8).toUpperCase()} have arrived and your order is now confirmed.`,
          type: 'ORDER',
        };
        historyNote = 'Personal shopping items arrived — order confirmed';
      }

      if (status === 'CANCELLED' && (order.status === 'PENDING_DEPOSIT' || order.status === 'DEPOSIT_SUBMITTED' || order.status === 'SALES_ORDER' || order.status === 'AWAITING_QR')) {
        releaseReserved = true;
        historyNote = 'Order cancelled';
      }

      if (status === 'DELIVERED') {
        historyNote = 'Marked as delivered';
      }

      if (status === 'SHIPPED') {
        updateData.shippedAt = new Date();
        historyNote = 'Order shipped';
      }
    }

    // BDO Checkout: staff upload the QR for this order. The first upload releases the order
    // to the customer and starts their 24-hour deposit window; later uploads just replace it.
    if (paymentQr !== undefined) {
      if (typeof paymentQr !== 'string' || !paymentQr.startsWith('data:image/') || paymentQr.length > 4_000_000) {
        return NextResponse.json({ error: 'Upload a valid QR image (under about 3 MB)' }, { status: 400 });
      }
      if (order.status !== 'AWAITING_QR' && order.status !== 'PENDING_DEPOSIT') {
        return NextResponse.json({ error: 'A QR can only be added while the order is awaiting payment' }, { status: 400 });
      }
      const pmRow = order.paymentMethodId
        ? (await db.select().from(paymentMethods).where(eq(paymentMethods.id, order.paymentMethodId)).limit(1))[0]
        : undefined;
      if (pmRow?.type !== 'BDO_CHECKOUT') {
        return NextResponse.json({ error: 'This order does not use BDO Checkout' }, { status: 400 });
      }

      updateData.paymentQr = paymentQr;
      if (order.status === 'AWAITING_QR') {
        qrReleased = true;
        updateData.status = 'PENDING_DEPOSIT';
        updateData.reservationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        historyNote = 'BDO Checkout QR uploaded — customer can now pay';
        pendingNotification = {
          userId: order.userId,
          title: 'BDO Checkout QR Ready',
          message: `The BDO Checkout QR for your order #${order.id.slice(-8).toUpperCase()} is ready. Scan it to pay and upload your proof of payment within 24 hours.`,
          type: 'ORDER',
        };
      } else {
        historyNote = 'BDO Checkout QR replaced';
      }
    }

    // Ignore a repeat confirmation so stock can never be deducted twice
    if (depositConfirmed !== undefined && !(depositConfirmed && order.depositConfirmed)) {
      updateData.depositConfirmed = depositConfirmed;
      if (depositConfirmed) {
        if (hasPasabuyItems) {
          // Pasabuy orders wait for physical arrival before being fully confirmed
          updateData.status = 'WAITING_FOR_ARRIVAL';
          pendingNotification = {
            userId: order.userId,
            title: 'Deposit Confirmed',
            message: `Your deposit for order #${order.id.slice(-8).toUpperCase()} has been confirmed. Your personal shopping items are being sourced — we'll notify you when they arrive! Your sales invoice is now available in your order details.`,
            type: 'ORDER',
          };
          historyNote = 'Deposit confirmed — sourcing personal shopping item(s)';
        } else {
          // Regular on-hand order — confirm immediately and deduct stock
          updateData.status = 'CONFIRMED';
          deductStock = true;
          pendingNotification = {
            userId: order.userId,
            title: 'Deposit Confirmed',
            message: `Your deposit for order #${order.id.slice(-8).toUpperCase()} has been confirmed. Your order is being processed. Your sales invoice is now available in your order details.`,
            type: 'ORDER',
          };
          historyNote = 'Deposit confirmed';
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
      historyNote = 'Order shipped';
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

  // Record who was responsible for this step, non-blocking like the notification above
  if (updateData.status) {
    try {
      await db.insert(orderStatusHistory).values({
        orderId: params.id,
        status: updateData.status,
        note: historyNote,
        actorId: session.user.id,
        actorName: session.user.name ?? session.user.email ?? session.user.role,
        actorRole: session.user.role,
      });
    } catch {
      // History logging failure should not affect the order status update
    }
  }

  if (qrReleased) {
    try {
      const customer = await db.query.users.findFirst({ where: eq(users.id, order.userId), columns: { name: true, email: true } });
      if (customer?.email) {
        await sendBdoQrReadyEmail({
          to: customer.email,
          name: customer.name ?? 'there',
          orderRef: order.id.slice(-8).toUpperCase(),
          orderId: order.id,
          total: order.totalAmount,
          depositDeadline: updateData.reservationExpiry as Date,
        });
      }
    } catch (e) {
      console.error('[email] BDO QR ready email failed', e);
    }
  }

  // Customer emails for the three milestones: paid (payments@), shipped and delivered (logistics@).
  // Only on a real transition, and a mail problem never fails the status change that already saved.
  const nowPaid = updateData.depositConfirmed === true && !order.depositConfirmed;
  const nowShipped = updateData.status === 'SHIPPED' && order.status !== 'SHIPPED';
  const nowDelivered = updateData.status === 'DELIVERED' && order.status !== 'DELIVERED';
  if (nowPaid || nowShipped || nowDelivered) {
    try {
      const customer = await db.query.users.findFirst({ where: eq(users.id, order.userId), columns: { name: true, email: true } });
      // Walk-in customers without an email get a placeholder address — nothing to send to
      if (customer?.email && !customer.email.endsWith('@holygrail.local')) {
        const base = {
          to: customer.email,
          name: customer.name ?? 'there',
          orderRef: order.id.slice(-8).toUpperCase(),
          orderId: order.id,
          items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
          total: order.totalAmount,
          deliveryLabel: deliveryLabel(order.deliveryMethod),
        };
        if (nowPaid) await sendOrderPaidEmail({ ...base, sourcing: hasPasabuyItems });
        if (nowShipped) await sendOrderShippedEmail(base);
        if (nowDelivered) await sendOrderDeliveredEmail(base);
      }
    } catch (e) {
      console.error('[email] order milestone email failed', e);
    }
  }

  const updatedOrder = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
    with: {
      user: { columns: { id: true, customerId: true, name: true, email: true, phone: true } },
      items: { with: { product: true } },
      statusHistory: { orderBy: asc(orderStatusHistory.createdAt) },
    },
  });

  return NextResponse.json(updatedOrder);
}
