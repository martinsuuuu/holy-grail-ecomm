import { createHash, randomBytes } from 'crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emailTokens } from '@/db/schema';

export type EmailTokenType = 'VERIFY' | 'RESET';

const TTL_MS: Record<EmailTokenType, number> = {
  VERIFY: 24 * 60 * 60 * 1000,
  RESET: 60 * 60 * 1000,
};

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

// Issues a fresh token and invalidates any earlier unused ones of the same type.
export async function createEmailToken(userId: string, type: EmailTokenType): Promise<string> {
  await db.delete(emailTokens).where(
    and(eq(emailTokens.userId, userId), eq(emailTokens.type, type), isNull(emailTokens.usedAt))
  );
  const token = randomBytes(32).toString('hex');
  await db.insert(emailTokens).values({
    userId,
    type,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + TTL_MS[type]),
  });
  return token;
}

// Marks the token used and returns its userId, or null if it's invalid, expired or already used.
export async function consumeEmailToken(token: string, type: EmailTokenType): Promise<string | null> {
  const rows = await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailTokens.tokenHash, hash(token)),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date())
      )
    )
    .returning({ userId: emailTokens.userId });
  return rows[0]?.userId ?? null;
}

// True if an unused token of this type was issued within the last `ms` — a cheap
// cooldown so the email endpoints can't be used to spam someone's inbox.
export async function hasRecentEmailToken(userId: string, type: EmailTokenType, ms = 60_000): Promise<boolean> {
  const rows = await db
    .select({ createdAt: emailTokens.createdAt })
    .from(emailTokens)
    .where(and(eq(emailTokens.userId, userId), eq(emailTokens.type, type), isNull(emailTokens.usedAt)))
    .limit(1);
  return Boolean(rows[0] && Date.now() - rows[0].createdAt.getTime() < ms);
}
