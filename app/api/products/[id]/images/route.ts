import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { productImages } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Appends a single gallery image to a product, instead of the full-replace
// semantics of PUT /api/products/[id] (delete-all-then-reinsert the whole
// images array). Used by the bulk image upload queue, where each file is
// uploaded and saved independently as it completes — so one slow/failed
// file can't block or clobber the others, and the admin doesn't need to
// hold the full product form open while a large batch finishes.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing image url' }, { status: 400 });
  }

  const existing = await db
    .select({ sortOrder: productImages.sortOrder })
    .from(productImages)
    .where(eq(productImages.productId, params.id));

  const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((e) => e.sortOrder)) + 1 : 0;

  const [inserted] = await db.insert(productImages).values({
    productId: params.id,
    url,
    sortOrder: nextSortOrder,
  }).returning();

  return NextResponse.json(inserted, { status: 201 });
}
