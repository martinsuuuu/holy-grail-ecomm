import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatHourRange } from '@/lib/appointments';
import { sendAppointmentConfirmedEmail } from '@/lib/email';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await request.json();

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const [updated] = await db.update(appointments)
    .set({ status })
    .where(eq(appointments.id, params.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  if (status === 'CONFIRMED') {
    const dateLabel = new Date(updated.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    const timeLabel = formatHourRange(updated.hour);

    // In-app notification — only possible for a logged-in customer's booking
    if (updated.userId) {
      try {
        await db.insert(notifications).values({
          userId: updated.userId,
          title: 'Appointment Confirmed',
          message: `Your showroom appointment on ${dateLabel}, ${timeLabel} has been confirmed. We look forward to seeing you!`,
          type: 'APPOINTMENT',
        });
      } catch {
        // Notification failure shouldn't block the status update
      }
    }

    // Email works for guest bookings too, since it's on the appointment itself
    try {
      await sendAppointmentConfirmedEmail({
        to: updated.email,
        name: updated.name,
        dateLabel,
        timeLabel,
      });
    } catch {
      // Email failure shouldn't block the status update
    }
  }

  return NextResponse.json(updated);
}
