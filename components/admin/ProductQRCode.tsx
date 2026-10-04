'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download } from 'lucide-react';

/** Renders a QR code onto a canvas and keeps it in sync with `value`/`size`. */
function QRCanvas({ value, size, canvasRef }: { value: string; size: number; canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#2d2114', light: '#ffffff' },
    }).catch(() => {});
  }, [value, size, canvasRef]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}

/**
 * A small QR thumbnail for a product, click-to-enlarge into a printable /
 * downloadable label. Encodes a direct link to the product's public page
 * (`/shop/[id]`) — scanning it with any phone camera identifies the exact
 * physical item on the spot, the same way a barcode scan would.
 */
export default function ProductQRCode({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const thumbRef = useRef<HTMLCanvasElement>(null);
  const fullRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const value = `${origin}/shop/${productId}`;

  const handleDownload = () => {
    if (!fullRef.current) return;
    const link = document.createElement('a');
    link.download = `${productName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.png`;
    link.href = fullRef.current.toDataURL('image/png');
    link.click();
  };

  if (!origin) {
    return <div className="w-10 h-10 rounded-lg bg-stone-100 animate-pulse" />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 rounded-lg border border-stone-200 hover:border-primary-300 transition-colors"
        title="View / print QR label"
      >
        <QRCanvas value={value} size={40} canvasRef={thumbRef} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-espresso/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-warm p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-espresso truncate">{productName}</p>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-espresso hover:bg-stone-100 transition-colors flex-shrink-0 ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center mb-4 p-3 bg-white border border-stone-200 rounded-xl">
              <QRCanvas value={value} size={220} canvasRef={fullRef} />
            </div>
            <p className="text-xs text-stone-400 mb-4 break-all">{value}</p>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-1.5 btn-primary"
            >
              <Download className="h-3.5 w-3.5" /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
}
