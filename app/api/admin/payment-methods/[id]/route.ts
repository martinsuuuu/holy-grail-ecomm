import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentMethods, notifications } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

async function notifyIfNoActivePaymentMethod() {
  const active = await db.select().from(paymentMethods)
    .where(and(eq(paymentMethods.isActive, true), isNotNull(paymentMethods.qrCode)));

  if (active.length === 0) {
    await db.insert(notifications).values({
      title: 'No Active Payment Method',
      message: 'Customers cannot place orders — no payment method with a QR code is currently active. Please upload a QR code or activate a payment method.',
      type: 'WARNING',
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, qrCode, isActive, accountName, accountNumber } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (qrCode !== undefined) updates.qrCode = qrCode;
  if (isActive !== undefined) updates.isActive = isActive;
  if (accountName !== undefined) updates.accountName = accountName;
  if (accountNumber !== undefined) updates.accountNumber = accountNumber;

  const [updated] = await db.update(paymentMethods)
    .set(updates)
    .where(eq(paymentMethods.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Notify if this change left no active payment methods available to customers
  const isReducingAction = qrCode === null || isActive === false;
  if (isReducingAction) await notifyIfNoActivePaymentMethod();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.delete(paymentMethods).where(eq(paymentMethods.id, params.id));
  await notifyIfNoActivePaymentMethod();

  return NextResponse.json({ success: true });
}
