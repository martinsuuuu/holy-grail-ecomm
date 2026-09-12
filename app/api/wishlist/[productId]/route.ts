import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { wishlistItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, session.user.id), eq(wishlistItems.productId, params.productId)));

  return NextResponse.json({ success: true });
}
