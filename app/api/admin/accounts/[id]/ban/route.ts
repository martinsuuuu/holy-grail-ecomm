import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You can't ban your own account" }, { status: 400 });
  }

  const userArr = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  const user = userArr[0];

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updatedArr = await db.update(users)
    .set({ banned: !user.banned })
    .where(eq(users.id, params.id))
    .returning();
  const updatedUser = updatedArr[0];

  return NextResponse.json({ banned: updatedUser.banned });
}
