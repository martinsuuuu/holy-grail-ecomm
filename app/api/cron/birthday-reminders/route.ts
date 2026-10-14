import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, notifications } from '@/db/schema';
import { eq, and, isNotNull, like } from 'drizzle-orm';
import { isUnauthorizedCronRequest } from '@/lib/cronAuth';

// How far ahead to start warning admins about an upcoming birthday.
const REMINDER_WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  if (isUnauthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customers = await db.select().from(users).where(
    and(eq(users.role, 'CUSTOMER'), isNotNull(users.birthDate))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;

  for (const customer of customers) {
    if (!customer.birthDate) continue;
    const [, month, day] = customer.birthDate.split('-').map(Number);
    if (!month || !day) continue;

    let nextBirthday = new Date(today.getFullYear(), month - 1, day);
    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
    }
    const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil > REMINDER_WINDOW_DAYS) continue;

    // Dedupe on email so the same upcoming birthday doesn't re-notify admins
    // every day the cron runs within the reminder window.
    const existing = await db.select().from(notifications).where(
      and(eq(notifications.type, 'BIRTHDAY'), like(notifications.message, `%${customer.email}%`))
    );
    const alreadyNotified = existing.some((n) => {
      const ageDays = (Date.now() - new Date(n.createdAt).getTime()) / 86_400_000;
      return ageDays <= REMINDER_WINDOW_DAYS + 1;
    });
    if (alreadyNotified) continue;

    const dateLabel = nextBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    await db.insert(notifications).values({
      title: daysUntil === 0 ? "Customer's Birthday Today" : 'Upcoming Customer Birthday',
      message: daysUntil === 0
        ? `🎂 It's ${customer.name}'s (${customer.email}) birthday today!`
        : `🎂 ${customer.name}'s (${customer.email}) birthday is on ${dateLabel} — in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`,
      type: 'BIRTHDAY',
    });
    created++;
  }

  return NextResponse.json({ success: true, created });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
