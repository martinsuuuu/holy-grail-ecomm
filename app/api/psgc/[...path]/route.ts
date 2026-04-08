import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const upstream = `https://psgc.cloud/api/${params.path.join('/')}`;
  console.log('[PSGC proxy] incoming path:', params.path, '→', upstream);

  try {
    const res = await fetch(upstream, { headers: { Accept: 'application/json' } });
    console.log('[PSGC proxy] upstream status:', res.status, 'for', upstream);

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
    }

    const data = await res.json();
    console.log('[PSGC proxy] returning', Array.isArray(data) ? `${data.length} items` : typeof data, 'for', upstream);
    return NextResponse.json(data);
  } catch (e) {
    console.error('[PSGC proxy] error for', upstream, e);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
