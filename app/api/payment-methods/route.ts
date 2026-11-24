import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentMethods } from '@/db/schema';
import { eq, asc, isNotNull, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const methods = await db.select().from(paymentMethods)
    .where(and(eq(paymentMethods.isActive, true), or(isNotNull(paymentMethods.qrCode), eq(paymentMethods.type, 'BDO_CHECKOUT'))))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt));
  return NextResponse.json(methods);
}
