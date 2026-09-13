import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchSiteConfig, saveSiteConfig } from '@/lib/siteConfigServer';
import { mergeSiteConfig } from '@/lib/siteConfig';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const config = await fetchSiteConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const config = mergeSiteConfig(body);
  await saveSiteConfig(config);

  return NextResponse.json(config);
}
