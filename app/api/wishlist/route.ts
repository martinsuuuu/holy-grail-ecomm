import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { wishlistItems } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await db.query.wishlistItems.findMany({
    where: eq(wishlistItems.userId, session.user.id),
    with: { product: true },
    orderBy: desc(wishlistItems.createdAt),
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const existing = await db.select().from(wishlistItems)
    .where(and(eq(wishlistItems.userId, session.user.id), eq(wishlistItems.productId, productId)))
    .limit(1);

  if (existing[0]) {
    return NextResponse.json(existing[0]);
  }

  const inserted = await db.insert(wishlistItems).values({
    userId: session.user.id,
    productId,
  }).returning();

  return NextResponse.json(inserted[0], { status: 201 });
}
