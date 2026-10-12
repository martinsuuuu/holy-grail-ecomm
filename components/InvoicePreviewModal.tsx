'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';
import { buildInvoicePdf, InvoiceOrder } from '@/lib/invoice';

export default function InvoicePreviewModal({
  order,
  orderTypeLabel,
  onClose,
}: {
  order: InvoiceOrder;
  orderTypeLabel: string;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileNameRef = useRef(`invoice-${order.id.slice(-8).toUpperCase()}.pdf`);

  useEffect(() => {
    let currentUrl: string | null = null;
    buildInvoicePdf(order, orderTypeLabel)
      .then((doc) => {
        currentUrl = doc.output('bloburl').toString();
        setBlobUrl(currentUrl);
      })
      .catch(() => setError('Could not generate the invoice. Please try again.'));
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [order, orderTypeLabel]);

  const handleDownload = async () => {
    const doc = await buildInvoicePdf(order, orderTypeLabel);
    doc.save(fileNameRef.current);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-warm w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <p className="font-display font-semibold text-espresso flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-700" />
            Invoice Preview
          </p>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-espresso transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-stone-100">
          {error ? (
            <div className="h-full flex items-center justify-center text-sm text-red-600 p-8 text-center">{error}</div>
          ) : blobUrl ? (
            <iframe src={blobUrl} title="Invoice preview" className="w-full h-full min-h-[60vh] border-0" />
          ) : (
            <div className="h-full min-h-[60vh] flex items-center justify-center text-espresso/40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-100">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={!blobUrl}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
