import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { APPOINTMENT_OPEN_HOUR, APPOINTMENT_CLOSE_HOUR } from '@/lib/appointments';

// Returns the hours already taken for a given date, so the booking page can
// gray them out. No auth required — availability is public information.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid date (YYYY-MM-DD) is required' }, { status: 400 });
  }

  const taken = await db.query.appointments.findMany({
    where: and(eq(appointments.date, date), ne(appointments.status, 'CANCELLED')),
    columns: { hour: true },
  });

  return NextResponse.json({ takenHours: taken.map(t => t.hour) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { name, email, phone, date, hour, notes } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid date is required' }, { status: 400 });
  }

  const hourNum = Number(hour);
  if (!Number.isInteger(hourNum) || hourNum < APPOINTMENT_OPEN_HOUR || hourNum >= APPOINTMENT_CLOSE_HOUR) {
    return NextResponse.json({ error: 'Please choose a valid showroom hour' }, { status: 400 });
  }

  // Don't allow booking a slot that's already taken for that date — check
  // again server-side since the client's availability snapshot can be stale.
  const conflict = await db.query.appointments.findFirst({
    where: and(eq(appointments.date, date), eq(appointments.hour, hourNum), ne(appointments.status, 'CANCELLED')),
  });
  if (conflict) {
    return NextResponse.json({ error: 'That time slot was just booked — please choose another.' }, { status: 409 });
  }

  const [appointment] = await db.insert(appointments).values({
    userId: session?.user?.role === 'CUSTOMER' ? session.user.id : null,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    date,
    hour: hourNum,
    notes: notes?.trim() || null,
    status: 'PENDING',
  }).returning();

  return NextResponse.json(appointment, { status: 201 });
}
