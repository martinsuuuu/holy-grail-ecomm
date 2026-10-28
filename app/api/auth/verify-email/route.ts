import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { consumeEmailToken } from '@/lib/emailTokens';

export async function POST(request: NextRequest) {
  const { token } = await request.json().catch(() => ({}));
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }

  const userId = await consumeEmailToken(token, 'VERIFY');
  if (!userId) {
    return NextResponse.json({ error: 'This link is invalid or has expired' }, { status: 400 });
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId));
  return NextResponse.json({ success: true });
}
