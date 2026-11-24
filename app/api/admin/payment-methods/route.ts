import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentMethods } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const methods = await db.select().from(paymentMethods)
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt));
  return NextResponse.json(methods);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, name } = await request.json();

  if (!type || !['GCASH', 'BANK_TRANSFER', 'BDO_CHECKOUT'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const [created] = await db.insert(paymentMethods).values({
    type,
    name: name.trim(),
    isActive: true,
    sortOrder: 99,
  }).returning();

  return NextResponse.json(created, { status: 201 });
}
