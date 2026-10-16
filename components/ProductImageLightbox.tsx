'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

/**
 * Full-size image viewer — shows the complete, uncropped photo (the inline
 * thumbnail box uses object-cover and crops it), with proper multi-level
 * zoom: +/- buttons, scroll-wheel/trackpad zoom, and double-click to toggle.
 * Panning while zoomed in is native browser scroll (works with mouse drag,
 * trackpad, and touch) rather than custom gesture code.
 */
export default function ProductImageLightbox({
  images,
  index,
  alt,
  onClose,
  onNavigate,
}: {
  images: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP));
  const isZoomed = zoom > 1;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) onNavigate((index - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight' && images.length > 1) onNavigate((index + 1) % images.length);
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onClose, onNavigate]);

  useEffect(() => {
    setZoom(1);
  }, [index]);

  // React's onWheel is attached passively by default, so e.preventDefault()
  // there is a no-op (and logs a console warning) — attach natively with
  // {passive: false} instead so scrolling to zoom doesn't also trigger the
  // browser's own page-scroll/swipe-navigation gesture underneath.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampZoom(z - e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-espresso/90 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 p-2 text-cream/80 hover:text-cream bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white/10 rounded-full p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="p-2 text-cream/80 hover:text-cream hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-cream/80 w-10 text-center select-none">{Math.round(zoom * 100)}%</span>
        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="p-2 text-cream/80 hover:text-cream hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-cream/80 hover:text-cream bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % images.length); }}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-cream/80 hover:text-cream bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className={`w-full h-full flex items-center justify-center ${isZoomed ? 'overflow-auto' : 'overflow-hidden'}`}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : clampZoom(1 + ZOOM_STEP * 2)))}
      >
        <img
          src={images[index]}
          alt={alt}
          draggable={false}
          className={`transition-transform duration-150 max-w-full max-h-full w-auto h-auto object-contain ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-cream/60 bg-white/10 px-3 py-1 rounded-full">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
