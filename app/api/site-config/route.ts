import { NextResponse } from 'next/server';
import { fetchSiteConfig } from '@/lib/siteConfigServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await fetchSiteConfig();
  return NextResponse.json(config);
}
