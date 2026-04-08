import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.select().from(categories).orderBy(asc(categories.name));
  return NextResponse.json(result);
}
