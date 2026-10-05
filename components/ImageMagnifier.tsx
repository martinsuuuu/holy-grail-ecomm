'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoomIn } from 'lucide-react';

const LENS_SIZE = 160;
const ZOOM = 2.5;

/**
 * Cursor-following magnifier lens over a product photo — lets a shopper
 * inspect stitching, hardware, and wear detail before adding to cart.
 * Desktop/hover only; touch devices already get the browser's native
 * pinch-to-zoom, so the lens is skipped there rather than fighting it.
 */
export default function ImageMagnifier({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supportsHover, setSupportsHover] = useState(false);
  const [active, setActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setSupportsHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensX = Math.min(Math.max(x - LENS_SIZE / 2, -LENS_SIZE / 2), rect.width - LENS_SIZE / 2);
    const lensY = Math.min(Math.max(y - LENS_SIZE / 2, -LENS_SIZE / 2), rect.height - LENS_SIZE / 2);
    setLensPos({ x: lensX, y: lensY });

    setBgPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseEnter={() => supportsHover && setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={supportsHover ? handleMouseMove : undefined}
    >
      <img src={src} alt={alt} className={className} />

      {supportsHover && !active && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-espresso/60 text-cream text-[11px] px-2 py-1 rounded-full pointer-events-none">
          <ZoomIn className="h-3 w-3" />
          Hover to zoom
        </div>
      )}

      {active && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-white shadow-warm ring-1 ring-black/10"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lensPos.x,
            top: lensPos.y,
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
}
