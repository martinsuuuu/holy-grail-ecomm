import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { and, eq, ilike } from 'drizzle-orm';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';

// Notifications only carry the short "#AB12CD34" order reference (the last 8
// characters of the order id) in their text. This resolves it to the full id so
// a notification can link to the order. Customers can only resolve their own orders.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get('ref') ?? '';
  if (!/^[A-Za-z0-9]{8}$/.test(ref)) {
    return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
  }

  const suffixMatch = ilike(orders.id, `%${ref}`);
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(session.user.role === 'ADMIN' ? suffixMatch : and(suffixMatch, eq(orders.userId, session.user.id)))
    .limit(1);

  if (!rows[0]) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ id: rows[0].id });
}
