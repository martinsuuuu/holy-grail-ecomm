import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// Site Editor images (hero slides, testimonials, category tiles, sourcing
// photo) used to be base64-encoded straight into the site_config JSON, which
// every page load fetches — that's why there was a tight (900KB) size cap.
// Uploading to Blob instead keeps site_config as just a URL string, so
// there's no practical size limit here.
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
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No server-side bookkeeping — the client stores the returned blob
        // URL directly on the relevant site config field.
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
