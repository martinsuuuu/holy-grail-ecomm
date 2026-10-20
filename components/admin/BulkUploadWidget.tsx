'use client';

import { useState } from 'react';
import { useBulkUploadStore } from '@/lib/bulkImageUploadStore';
import { UploadCloud, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';

// Rendered once in the admin layout (not per-page) so it keeps tracking
// progress — and lets the admin keep working elsewhere in the admin panel
// — no matter which admin page they navigate to while a batch uploads.
export default function BulkUploadWidget() {
  const jobs = useBulkUploadStore((s) => s.jobs);
  const dismissDone = useBulkUploadStore((s) => s.dismissDone);
  const [collapsed, setCollapsed] = useState(false);

  if (jobs.length === 0) return null;

  const total = jobs.length;
  const done = jobs.filter((j) => j.status === 'done').length;
  const errors = jobs.filter((j) => j.status === 'error').length;
  const finished = done + errors;
  const allFinished = finished === total;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-white rounded-2xl shadow-warm border border-stone-200/70 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
        {allFinished ? (
          errors > 0
            ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <Loader2 className="h-4 w-4 text-primary-600 flex-shrink-0 animate-spin" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-espresso truncate">
            {allFinished
              ? `Uploaded ${done}/${total} image${total === 1 ? '' : 's'}${errors > 0 ? ` (${errors} failed)` : ''}`
              : `Uploading images… ${finished}/${total}`}
          </p>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 text-stone-400 hover:text-espresso rounded transition-colors flex-shrink-0"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {allFinished && (
          <button
            onClick={dismissDone}
            className="p-1 text-stone-400 hover:text-espresso rounded transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="h-1.5 bg-stone-100">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${total > 0 ? (finished / total) * 100 : 0}%` }}
            />
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-stone-50">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-2 px-4 py-2 text-xs">
                {job.status === 'queued' && <UploadCloud className="h-3.5 w-3.5 text-stone-300 flex-shrink-0" />}
                {job.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 text-primary-500 flex-shrink-0 animate-spin" />}
                {job.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                {job.status === 'error' && <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-stone-700">{job.fileName}</p>
                  <p className="truncate text-stone-400">{job.productName}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
