import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { itemTypes } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const result = await db.select().from(itemTypes).orderBy(asc(itemTypes.name));
  return NextResponse.json(result);
}
