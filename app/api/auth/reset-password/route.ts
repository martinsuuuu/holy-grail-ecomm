import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { consumeEmailToken } from '@/lib/emailTokens';

export async function POST(request: NextRequest) {
  const { token, password } = await request.json().catch(() => ({}));
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'This link is invalid or has expired' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const userId = await consumeEmailToken(token, 'RESET');
  if (!userId) {
    return NextResponse.json({ error: 'This link is invalid or has expired' }, { status: 400 });
  }

  // Clicking a link sent to their inbox also proves the email is theirs
  await db
    .update(users)
    .set({ password: await bcrypt.hash(password, 10), emailVerified: new Date() })
    .where(eq(users.id, userId));
  return NextResponse.json({ success: true });
}
