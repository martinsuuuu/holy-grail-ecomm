'use client';

import { create } from 'zustand';
import { upload } from '@vercel/blob/client';
import { resizeImageFile } from '@/lib/image';

export type BulkUploadJobStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface BulkUploadJob {
  id: string;
  productId: string;
  productName: string;
  fileName: string;
  status: BulkUploadJobStatus;
  error?: string;
}

interface BulkUploadStore {
  jobs: BulkUploadJob[];
  enqueue: (productId: string, productName: string, files: File[]) => void;
  dismissDone: () => void;
}

// File objects aren't kept in the zustand state itself (no reason to trigger
// re-renders over them) — just matched up with their job by id here.
const fileById = new Map<string, File>();

// How many uploads run at once. High enough that a big batch doesn't take
// forever serially, low enough not to hammer Blob/the DB or saturate the
// admin's upload bandwidth with a single giant burst.
const CONCURRENCY = 3;
let activeCount = 0;

export const useBulkUploadStore = create<BulkUploadStore>((set, get) => ({
  jobs: [],

  enqueue: (productId, productName, files) => {
    const newJobs: BulkUploadJob[] = files.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      fileById.set(id, file);
      return { id, productId, productName, fileName: file.name, status: 'queued' };
    });
    set((state) => ({ jobs: [...state.jobs, ...newJobs] }));
    drainQueue(get, set);
  },

  dismissDone: () => {
    set((state) => ({ jobs: state.jobs.filter((j) => j.status !== 'done' && j.status !== 'error') }));
  },
}));

function drainQueue(
  get: () => BulkUploadStore,
  set: (fn: (state: BulkUploadStore) => Partial<BulkUploadStore>) => void
) {
  while (activeCount < CONCURRENCY) {
    const next = get().jobs.find((j) => j.status === 'queued');
    if (!next) return;

    activeCount++;
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === next.id ? { ...j, status: 'uploading' } : j)),
    }));

    runJob(next).then((error) => {
      activeCount--;
      set((state) => ({
        jobs: state.jobs.map((j) =>
          j.id === next.id ? { ...j, status: error ? 'error' : 'done', error } : j
        ),
      }));
      fileById.delete(next.id);
      drainQueue(get, set);
    });
  }
}

async function runJob(job: BulkUploadJob): Promise<string | undefined> {
  const file = fileById.get(job.id);
  if (!file) return 'File no longer available';

  try {
    const resized = await resizeImageFile(file);
    const result = await upload(resized.name, resized, {
      access: 'public',
      handleUploadUrl: '/api/admin/image-upload',
    });

    const res = await fetch(`/api/products/${job.productId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: result.url }),
    });
    if (!res.ok) throw new Error('Failed to save image to product');

    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : 'Upload failed';
  }
}
