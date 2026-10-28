import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { emailConfigured, sendVerificationEmail } from '@/lib/email';
import { createEmailToken } from '@/lib/emailTokens';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, phone, birthDate } = body;

  if (!name || !email || !password || !phone || !birthDate) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || new Date(birthDate) > new Date()) {
    return NextResponse.json({ error: 'Please provide a valid birthdate' }, { status: 400 });
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
    phone: phone.trim(),
    birthDate,
    role: 'CUSTOMER',
    // Without SMTP configured nobody could ever verify, so don't lock them out
    emailVerified: emailConfigured ? null : new Date(),
  }).returning();
  const user = newUserArr[0];

  // Welcome notification
  await db.insert(notifications).values({
    userId: user.id,
    title: 'Welcome to Holy Grail!',
    message: 'Your account has been created. Start shopping today!',
    type: 'INFO',
  });

  let requiresVerification = false;
  if (emailConfigured) {
    requiresVerification = true;
    try {
      const token = await createEmailToken(user.id, 'VERIFY');
      await sendVerificationEmail({ to: user.email, name: user.name, token });
    } catch {
      // The account exists; they can request another verification email from the login page
    }
  }

  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json({ ...userWithoutPassword, requiresVerification }, { status: 201 });
}
