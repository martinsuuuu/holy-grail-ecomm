import { NextRequest } from 'next/server';

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on scheduled
 *  invocations. If CRON_SECRET isn't set (e.g. local dev), auth is skipped
 *  rather than locking the route out entirely. */
export function isUnauthorizedCronRequest(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;
  return request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`;
}
