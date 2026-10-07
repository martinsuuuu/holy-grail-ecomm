import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Match by linked account OR by email — a booking made as a guest (or
  // before this account existed) still shows up here as long as the email
  // matches, not only ones linked at the moment they were booked.
  const byUserId = eq(appointments.userId, session.user.id);
  const mine = await db.query.appointments.findMany({
    where: session.user.email ? or(byUserId, eq(appointments.email, session.user.email.toLowerCase())) : byUserId,
    orderBy: desc(appointments.createdAt),
  });

  return NextResponse.json(mine);
}
