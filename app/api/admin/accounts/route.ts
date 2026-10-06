import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Staff/warehouse accounts only — customers have their own dedicated tab
// (Admin > Customers) with its own management flow, kept separate so the
// two account types don't get mixed together in one list.
const VALID_ROLES = ['ADMIN', 'SHIPPER'];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await db.query.users.findMany({
    where: inArray(users.role, VALID_ROLES),
    columns: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      phone: true,
      createdAt: true,
    },
    orderBy: desc(users.createdAt),
  });

  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, password, phone, role } = body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Role must be Staff or Shipper — customer accounts are created from the Customers tab' }, { status: 400 });
  }

  const existingUserArr = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  if (existingUserArr[0]) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUserArr = await db.insert(users).values({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    phone: phone?.trim() || null,
    role,
  }).returning();
  const user = newUserArr[0];

  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}
