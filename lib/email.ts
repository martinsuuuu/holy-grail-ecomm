import nodemailer from 'nodemailer';

// Email is optional infrastructure: it only activates once the SMTP_* settings
// are present (Hostinger mailbox: smtp.hostinger.com, port 465). Until then,
// every send here just logs and returns — the rest of the app (in-app
// notifications, admin visibility) works the same either way.
export const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : null;

const FROM = process.env.EMAIL_FROM || `Holy Grail <${process.env.SMTP_USER}>`;

export const appUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[email] Skipped — SMTP not configured. Would have sent "${subject}" to ${to}.`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

function layout(heading: string, body: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2d2114;">
      <h1 style="font-size: 20px; margin-bottom: 4px;">Holy Grail</h1>
      <p style="color: #0B3D2E; font-weight: 600; font-size: 16px;">${heading}</p>
      ${body}
    </div>`;
}

const button = (href: string, label: string) =>
  `<p style="margin: 24px 0;"><a href="${href}" style="background: #0B3D2E; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">${label}</a></p>`;

export async function sendVerificationEmail({ to, name, token }: { to: string; name: string; token: string }): Promise<void> {
  const link = `${appUrl()}/verify-email?token=${token}`;
  await send(
    to,
    'Verify your Holy Grail email',
    layout(
      'Confirm your email address',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Welcome to Holy Grail. Please confirm your email to activate your account.</p>
       ${button(link, 'Verify email')}
       <p style="color: #777; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`
    )
  );
}

export async function sendPasswordResetEmail({ to, name, token }: { to: string; name: string; token: string }): Promise<void> {
  const link = `${appUrl()}/reset-password?token=${token}`;
  await send(
    to,
    'Reset your Holy Grail password',
    layout(
      'Reset your password',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>We received a request to reset your password.</p>
       ${button(link, 'Choose a new password')}
       <p style="color: #777; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>`
    )
  );
}

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
  await send(
    to,
    'Your Holy Grail Appointment is Confirmed',
    layout(
      'Your appointment is confirmed',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>We're looking forward to seeing you at our showroom.</p>
       <table style="margin: 16px 0; font-size: 14px;">
         <tr><td style="padding: 4px 12px 4px 0; color: #777;">Date</td><td style="font-weight: 600;">${escapeHtml(dateLabel)}</td></tr>
         <tr><td style="padding: 4px 12px 4px 0; color: #777;">Time</td><td style="font-weight: 600;">${escapeHtml(timeLabel)}</td></tr>
       </table>
       <p style="color: #777; font-size: 13px;">Unit 2Y, Lee Gardens Condominium, Lee St. cor. Shaw Boulevard, Brgy. Wack Wack, Mandaluyong City, Philippines</p>
       <p style="color: #777; font-size: 13px;">Need to reschedule? Just reply to this email.</p>`
    )
  );
}
