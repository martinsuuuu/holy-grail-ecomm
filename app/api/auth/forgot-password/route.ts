import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { sendPasswordResetEmail } from '@/lib/email';
import { createEmailToken, hasRecentEmailToken } from '@/lib/emailTokens';

// Always answers the same way so this can't be used to discover which emails are registered.
export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));
  const generic = NextResponse.json({ success: true });
  if (!email || typeof email !== 'string') return generic;

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || user.banned) return generic;
  if (await hasRecentEmailToken(user.id, 'RESET')) return generic;

  try {
    const token = await createEmailToken(user.id, 'RESET');
    await sendPasswordResetEmail({ to: user.email, name: user.name, token });
  } catch {
    // Swallow — the response must not reveal anything
  }
  return generic;
}
