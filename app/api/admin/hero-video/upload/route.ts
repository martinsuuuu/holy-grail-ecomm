import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// Shared by both the Hero Carousel and Video Carousel admin editors — nothing
// here is hero-specific, so both reuse this one route rather than duplicating it.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
          throw new Error('Unauthorized');
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No server-side bookkeeping needed — the client stores the
        // returned blob URL directly on the slide/video item via the site config.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
