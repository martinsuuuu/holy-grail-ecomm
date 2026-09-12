import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promoCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { code, subtotal } = await request.json();

  if (!code?.trim() || typeof subtotal !== 'number') {
    return NextResponse.json({ valid: false, error: 'A promo code and subtotal are required' }, { status: 400 });
  }

  const arr = await db.select().from(promoCodes).where(eq(promoCodes.code, code.trim().toUpperCase())).limit(1);
  const promo = arr[0];

  if (!promo) {
    return NextResponse.json({ valid: false, error: 'Promo code not found' }, { status: 400 });
  }
  if (!promo.isActive) {
    return NextResponse.json({ valid: false, error: 'This promo code is no longer active' }, { status: 400 });
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, error: 'This promo code has expired' }, { status: 400 });
  }

  const rawDiscount = promo.type === 'PERCENT' ? (subtotal * promo.value) / 100 : promo.value;
  const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal);

  return NextResponse.json({
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discountAmount,
  });
}
