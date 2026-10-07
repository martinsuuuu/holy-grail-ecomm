import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mine = await db.query.appointments.findMany({
    where: eq(appointments.userId, session.user.id),
    orderBy: desc(appointments.createdAt),
  });

  return NextResponse.json(mine);
}
