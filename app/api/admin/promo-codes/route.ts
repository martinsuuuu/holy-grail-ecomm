import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { promoCodes } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  return NextResponse.json(codes);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code, type, value, expiresAt } = await request.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }
  if (!type || !['PERCENT', 'FIXED'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (typeof value !== 'number' || value <= 0) {
    return NextResponse.json({ error: 'Value must be a positive number' }, { status: 400 });
  }

  try {
    const [created] = await db.insert(promoCodes).values({
      code: code.trim().toUpperCase(),
      type,
      value,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'A promo code with that name already exists' }, { status: 409 });
    }
    throw err;
  }
}
