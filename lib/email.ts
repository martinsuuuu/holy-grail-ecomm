import nodemailer from 'nodemailer';

// Email is optional infrastructure: it only activates once the SMTP_* settings
// are present (Hostinger mailbox: smtp.hostinger.com, port 465). Until then,
// every send here just logs and returns — the rest of the app (in-app
// notifications, admin visibility) works the same either way.
// Each department can send from its own Hostinger mailbox (appointments@, consignment@,
// sourcing@). A channel uses SMTP_<CHANNEL>_USER / SMTP_<CHANNEL>_PASSWORD when both are
// set, and otherwise falls back to the default SMTP_USER mailbox.
export type EmailChannel = 'default' | 'appointments' | 'consignment' | 'sourcing' | 'payments' | 'shipping';

const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

function channelCredentials(channel: EmailChannel): { user: string; pass: string } | null {
  if (channel !== 'default') {
    const key = channel.toUpperCase();
    const user = process.env[`SMTP_${key}_USER`];
    const pass = process.env[`SMTP_${key}_PASSWORD`];
    if (user && pass) return { user, pass };
  }
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  return user && pass ? { user, pass } : null;
}

const transporters = new Map<string, ReturnType<typeof nodemailer.createTransport>>();

function transportFor(channel: EmailChannel) {
  const creds = process.env.SMTP_HOST ? channelCredentials(channel) : null;
  if (!creds) return null;
  let transporter = transporters.get(creds.user);
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: creds,
    });
    transporters.set(creds.user, transporter);
  }
  return { transporter, user: creds.user };
}

export const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

export const appUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function send(to: string, subject: string, html: string, channel: EmailChannel = 'default'): Promise<void> {
  const t = transportFor(channel);
  if (!t) {
    console.log(`[email] Skipped — SMTP not configured. Would have sent "${subject}" to ${to}.`);
    return;
  }
  // EMAIL_FROM only applies to the default mailbox; department mailboxes send as themselves
  const from = channel === 'default' && process.env.EMAIL_FROM ? process.env.EMAIL_FROM : `Holy Grail <${t.user}>`;
  await t.transporter.sendMail({ from, to, subject, html });
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
    ),
    'appointments'
  );
}

const peso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function sendOrderPlacedEmail({
  to,
  name,
  orderRef,
  items,
  discountAmount,
  promoCode,
  total,
  deliveryLabel,
  paymentMethodName,
  depositDeadline,
  awaitingQr = false,
  channel = 'default',
}: {
  to: string;
  name: string;
  orderRef: string;
  items: { name: string; quantity: number; price: number }[];
  discountAmount: number;
  promoCode: string | null;
  total: number;
  deliveryLabel: string;
  paymentMethodName: string | null;
  depositDeadline: Date;
  awaitingQr?: boolean;
  channel?: EmailChannel;
}): Promise<void> {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding: 6px 12px 6px 0;">${escapeHtml(i.name)}${i.quantity > 1 ? ` × ${i.quantity}` : ''}</td>
        <td style="padding: 6px 0; text-align: right;">${peso(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('');
  const discountRow =
    discountAmount > 0
      ? `<tr><td style="padding: 6px 12px 6px 0; color: #777;">Discount${promoCode ? ` (${escapeHtml(promoCode)})` : ''}</td><td style="padding: 6px 0; text-align: right;">-${peso(discountAmount)}</td></tr>`
      : '';
  const deadline = depositDeadline.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  await send(
    to,
    `Your Holy Grail order #${orderRef} has been placed`,
    layout(
      'Thank you for your order',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>We've received your order <strong>#${orderRef}</strong>.</p>
       <table style="width: 100%; margin: 16px 0; font-size: 14px; border-collapse: collapse;">
         ${rows}
         ${discountRow}
         <tr><td style="padding: 10px 12px 6px 0; border-top: 1px solid #ddd; font-weight: 600;">Total</td><td style="padding: 10px 0 6px; border-top: 1px solid #ddd; text-align: right; font-weight: 600;">${peso(total)}</td></tr>
       </table>
       <table style="margin: 8px 0 16px; font-size: 14px;">
         <tr><td style="padding: 3px 12px 3px 0; color: #777;">Delivery</td><td>${escapeHtml(deliveryLabel)}</td></tr>
         ${paymentMethodName ? `<tr><td style="padding: 3px 12px 3px 0; color: #777;">Payment</td><td>${escapeHtml(paymentMethodName)}</td></tr>` : ''}
       </table>
       ${
         awaitingQr
           ? `<p style="background: #f6f1e7; padding: 12px 14px; border-radius: 8px; font-size: 14px;">
         <strong>Next step:</strong> we're preparing your BDO Checkout QR. We'll email and notify you as soon as it's ready to scan —
         your items are reserved in the meantime.
       </p>`
           : `<p style="background: #f6f1e7; padding: 12px 14px; border-radius: 8px; font-size: 14px;">
         <strong>Next step:</strong> please submit your deposit proof by <strong>${deadline} (PH time)</strong>
         from your order page. Orders without a deposit by then are released automatically.
       </p>`
       }
       ${button(`${appUrl()}/account`, 'View my orders')}`
    ),
    channel
  );
}

export async function sendAppointmentBookedEmail({
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
    'We received your Holy Grail appointment request',
    layout(
      'Your booking request is in',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Thanks for booking a showroom visit. Your request is <strong>pending confirmation</strong> — we'll email you once our team confirms it.</p>
       <table style="margin: 16px 0; font-size: 14px;">
         <tr><td style="padding: 4px 12px 4px 0; color: #777;">Date</td><td style="font-weight: 600;">${escapeHtml(dateLabel)}</td></tr>
         <tr><td style="padding: 4px 12px 4px 0; color: #777;">Time</td><td style="font-weight: 600;">${escapeHtml(timeLabel)}</td></tr>
       </table>
       <p style="color: #777; font-size: 13px;">Unit 2Y, Lee Gardens Condominium, Lee St. cor. Shaw Boulevard, Brgy. Wack Wack, Mandaluyong City, Philippines</p>
       <p style="color: #777; font-size: 13px;">Need to change it? Just reply to this email.</p>`
    ),
    'appointments'
  );
}

export async function sendBdoQrReadyEmail({
  to,
  name,
  orderRef,
  orderId,
  total,
  depositDeadline,
}: {
  to: string;
  name: string;
  orderRef: string;
  orderId: string;
  total: number;
  depositDeadline: Date;
}): Promise<void> {
  const deadline = depositDeadline.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  await send(
    to,
    `Your BDO Checkout QR for order #${orderRef} is ready`,
    layout(
      'Your payment QR is ready',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>The BDO Checkout QR for order <strong>#${orderRef}</strong> is now available. Scan it to pay <strong>${peso(total)}</strong>, then upload your proof of payment on the order page.</p>
       <p style="background: #f6f1e7; padding: 12px 14px; border-radius: 8px; font-size: 14px;">
         Please complete payment by <strong>${deadline} (PH time)</strong>. Orders without a deposit by then are released automatically.
       </p>
       ${button(`${appUrl()}/account/orders/${orderId}#order-status`, 'Open my order')}`
    )
  );
}

type OrderEmailBase = {
  to: string;
  name: string;
  orderRef: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  deliveryLabel: string;
};

function orderItemsTable(items: OrderEmailBase['items'], total: number): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding: 6px 12px 6px 0;">${escapeHtml(i.name)}${i.quantity > 1 ? ` × ${i.quantity}` : ''}</td>
        <td style="padding: 6px 0; text-align: right;">${peso(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('');
  return `<table style="width: 100%; margin: 16px 0; font-size: 14px; border-collapse: collapse;">
    ${rows}
    <tr><td style="padding: 10px 12px 6px 0; border-top: 1px solid #ddd; font-weight: 600;">Total</td><td style="padding: 10px 0 6px; border-top: 1px solid #ddd; text-align: right; font-weight: 600;">${peso(total)}</td></tr>
  </table>`;
}

const orderLink = (orderId: string) => `${appUrl()}/account/orders/${orderId}#order-status`;

// Sent from the payments mailbox once staff confirm the payment (or a walk-in order is paid in-store)
export async function sendOrderPaidEmail({ sourcing, ...o }: OrderEmailBase & { sourcing: boolean }): Promise<void> {
  await send(
    o.to,
    `Payment received for order #${o.orderRef}`,
    layout(
      'Payment confirmed',
      `<p>Hi ${escapeHtml(o.name)},</p>
       <p>We've received and confirmed your payment for order <strong>#${o.orderRef}</strong>. Thank you!</p>
       ${orderItemsTable(o.items, o.total)}
       <p style="background: #f6f1e7; padding: 12px 14px; border-radius: 8px; font-size: 14px;">
         ${
           sourcing
             ? 'Your personal shopping item(s) are now being sourced. We\'ll let you know as soon as they arrive.'
             : `Your order is now being prepared for ${escapeHtml(o.deliveryLabel)}. We'll email you again when it ships.`
         }
         Your sales invoice is available on your order page.
       </p>
       ${button(orderLink(o.orderId), 'View my order')}`
    ),
    'payments'
  );
}

// Sent from the shipping mailbox (logistics@) when the order goes out
export async function sendOrderShippedEmail(o: OrderEmailBase): Promise<void> {
  await send(
    o.to,
    `Your order #${o.orderRef} has shipped`,
    layout(
      'Your order is on its way',
      `<p>Hi ${escapeHtml(o.name)},</p>
       <p>Good news — order <strong>#${o.orderRef}</strong> has been shipped via <strong>${escapeHtml(o.deliveryLabel)}</strong>.</p>
       ${orderItemsTable(o.items, o.total)}
       ${button(orderLink(o.orderId), 'Track my order')}`
    ),
    'shipping'
  );
}

// Sent from the shipping mailbox (logistics@) when the order is marked delivered
export async function sendOrderDeliveredEmail(o: OrderEmailBase): Promise<void> {
  await send(
    o.to,
    `Your order #${o.orderRef} was delivered`,
    layout(
      'Your order has been delivered',
      `<p>Hi ${escapeHtml(o.name)},</p>
       <p>Order <strong>#${o.orderRef}</strong> has been marked as delivered. We hope you love your pieces!</p>
       ${orderItemsTable(o.items, o.total)}
       <p style="color: #777; font-size: 13px;">If anything isn't right, just reply to this email and we'll help.</p>
       ${button(orderLink(o.orderId), 'View my order')}`
    ),
    'shipping'
  );
}
