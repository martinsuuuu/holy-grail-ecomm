import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateCustomerId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customers = await db.query.users.findMany({
    where: eq(users.role, 'CUSTOMER'),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      banned: true,
      createdAt: true,
    },
    with: {
      orders: {
        columns: { id: true, totalAmount: true, status: true, createdAt: true, paymentMethodName: true, deliveryMethod: true, deliveryAddress: true },
        with: {
          items: {
            with: { product: { columns: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: desc(users.createdAt),
  });

  // Lazy-assign customerIds — silently skip if column not yet migrated
  const result = await Promise.all(customers.map(async c => {
    let customerId: string | null = null;
    try {
      const [row] = await db.select({ customerId: users.customerId }).from(users).where(eq(users.id, c.id));
      customerId = row?.customerId ?? null;
      if (!customerId) {
        customerId = generateCustomerId();
        await db.update(users).set({ customerId }).where(eq(users.id, c.id));
      }
    } catch { /* column not yet in DB */ }
    return { ...c, customerId };
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const existingUserArr = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUserArr[0]) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUserArr = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    role: 'CUSTOMER',
  }).returning();
  const user = newUserArr[0];

  // Assign customerId if column exists
  try {
    const cid = generateCustomerId();
    await db.update(users).set({ customerId: cid }).where(eq(users.id, user.id));
    (user as any).customerId = cid;
  } catch { /* column not yet migrated */ }

  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}
