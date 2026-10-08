'use client';

import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-size image viewer — shows the complete, uncropped photo (the inline
 * thumbnail box uses object-cover and crops it) with a click-to-zoom toggle,
 * replacing the old cursor-following magnifier lens.
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
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) onNavigate((index - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight' && images.length > 1) onNavigate((index + 1) % images.length);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onClose, onNavigate]);

  useEffect(() => {
    setIsZoomed(false);
  }, [index]);

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

      <button
        onClick={(e) => { e.stopPropagation(); setIsZoomed((z) => !z); }}
        aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cream/80 hover:text-cream bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        {isZoomed ? 'Zoom out' : 'Zoom in'}
      </button>

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
        className={`w-full h-full flex items-center justify-center ${isZoomed ? 'overflow-auto cursor-zoom-out' : 'overflow-hidden cursor-zoom-in'}`}
        onClick={(e) => { e.stopPropagation(); setIsZoomed((z) => !z); }}
      >
        <img
          src={images[index]}
          alt={alt}
          className={`transition-transform duration-200 ${
            isZoomed
              ? 'max-w-none w-auto h-auto scale-150 cursor-zoom-out'
              : 'max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in'
          }`}
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
