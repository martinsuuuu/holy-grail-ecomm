'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { X, Download } from 'lucide-react';

function Barcode({ sku, width, height, fontSize, canvasRef }: { sku: string; width: number; height: number; fontSize: number; canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      JsBarcode(canvasRef.current, sku, {
        format: 'CODE128',
        width,
        height,
        fontSize,
        margin: 6,
        background: '#ffffff',
        lineColor: '#2d2114',
      });
    } catch {
      // Defensive — CODE128 accepts any ASCII, so this shouldn't fire for
      // our 'HG-000000'-style SKUs, but avoid a blank canvas crash either way.
    }
  }, [sku, width, height, fontSize, canvasRef]);

  return <canvas ref={canvasRef} />;
}

/**
 * A small SKU barcode for a product, click-to-enlarge into a printable /
 * downloadable label — the human-readable SKU is always shown alongside
 * the bars themselves (JsBarcode's displayValue), so it's viewable even
 * without a scanner. Works like a traditional inventory barcode: scanning
 * it (any CODE128-capable scanner or barcode-reading phone app) reads back
 * the exact SKU, which uniquely and permanently identifies this product.
 */
export default function ProductBarcode({ sku }: { sku: string | null }) {
  const [open, setOpen] = useState(false);
  const thumbRef = useRef<HTMLCanvasElement>(null);
  const fullRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = () => {
    if (!fullRef.current || !sku) return;
    const link = document.createElement('a');
    link.download = `${sku}-barcode.png`;
    link.href = fullRef.current.toDataURL('image/png');
    link.click();
  };

  if (!sku) {
    return <span className="text-xs text-stone-300 italic">No SKU</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 rounded-lg border border-stone-200 hover:border-primary-300 transition-colors"
        title="View / print barcode label"
      >
        <Barcode sku={sku} width={1.1} height={28} fontSize={9} canvasRef={thumbRef} />
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
              <p className="text-sm font-semibold text-espresso">SKU / Barcode</p>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-espresso hover:bg-stone-100 transition-colors flex-shrink-0 ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center mb-4 p-3 bg-white border border-stone-200 rounded-xl overflow-x-auto">
              <Barcode sku={sku} width={2.2} height={70} fontSize={16} canvasRef={fullRef} />
            </div>
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
