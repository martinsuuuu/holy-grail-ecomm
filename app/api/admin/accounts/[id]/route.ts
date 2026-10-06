import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Staff/warehouse accounts only — see app/api/admin/accounts/route.ts.
const VALID_ROLES = ['ADMIN', 'SHIPPER'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, password, role } = body;

  // An admin can't demote themselves — prevents accidentally locking
  // everyone, including themselves, out of the admin panel.
  if (role !== undefined && params.id === session.user.id && role !== 'ADMIN') {
    return NextResponse.json({ error: "You can't change your own role" }, { status: 400 });
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (email?.trim()) updates.email = email.trim().toLowerCase();
  if (phone !== undefined) updates.phone = phone || null;
  if (password?.trim()) updates.password = await bcrypt.hash(password.trim(), 10);
  if (role !== undefined) updates.role = role;

  const [updated] = await db.update(users)
    .set(updates)
    .where(eq(users.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { password: _, ...safe } = updated;
  return NextResponse.json(safe);
}
