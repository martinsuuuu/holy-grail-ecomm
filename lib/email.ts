import { Resend } from 'resend';

// Email is optional infrastructure: it only activates once RESEND_API_KEY is
// set (https://resend.com — free tier, a few minutes to set up). Until then,
// every send here just logs and returns — the rest of the app (in-app
// notifications, admin visibility) works the same either way.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'Holy Grail <onboarding@resend.dev>';

export async function sendAppointmentConfirmedEmail({
  to,
  name,
  dateLabel,
  timeLabel,
}: {
  to: string;
  name: string;
  dateLabel: string;
  timeLabel: string;
}): Promise<void> {
  if (!resend) {
    console.log(`[email] Skipped — RESEND_API_KEY not set. Would have sent "Appointment Confirmed" to ${to}.`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your Holy Grail Appointment is Confirmed',
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2d2114;">
        <h1 style="font-size: 20px; margin-bottom: 4px;">Holy Grail</h1>
        <p style="color: #0B3D2E; font-weight: 600; font-size: 16px;">Your appointment is confirmed</p>
        <p>Hi ${name},</p>
        <p>We're looking forward to seeing you at our showroom.</p>
        <table style="margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; color: #777;">Date</td><td style="font-weight: 600;">${dateLabel}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #777;">Time</td><td style="font-weight: 600;">${timeLabel}</td></tr>
        </table>
        <p style="color: #777; font-size: 13px;">Unit 2Y, Lee Gardens Condominium, Lee St. cor. Shaw Boulevard, Brgy. Wack Wack, Mandaluyong City, Philippines</p>
        <p style="color: #777; font-size: 13px;">Need to reschedule? Just reply to this email.</p>
      </div>
    `,
  });
}
