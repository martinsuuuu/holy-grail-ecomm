import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    address: users.address,
  }).from(users).where(eq(users.id, session.user.id));

  // Fetch customerId separately so it doesn't break if column isn't migrated yet
  let customerId: string | null = null;
  try {
    const [row] = await db.select({ customerId: users.customerId }).from(users).where(eq(users.id, session.user.id));
    customerId = row?.customerId ?? null;
  } catch { /* column not yet in DB */ }

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...user, customerId });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phone, address, currentPassword, newPassword } = await request.json();

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (address !== undefined) updates.address = address?.trim() || null;

  if (newPassword?.trim()) {
    if (!currentPassword?.trim()) {
      return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
    }
    const [existing] = await db.select({ password: users.password }).from(users).where(eq(users.id, session.user.id));
    const valid = await bcrypt.compare(currentPassword.trim(), existing.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    updates.password = await bcrypt.hash(newPassword.trim(), 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, session.user.id)).returning();
  const { password: _, ...safe } = updated;
  return NextResponse.json(safe);
}
