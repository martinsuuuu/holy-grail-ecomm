'use client';

import { useState, useRef, useEffect } from 'react';

const LENS_SIZE = 160;
const ZOOM = 2.5;

/**
 * Cursor-following magnifier lens over a product photo — lets a shopper
 * inspect stitching, hardware, and wear detail on hover, without leaving
 * the page. Desktop/fine-pointer only; touch devices skip it (they get the
 * click-to-open full-size lightbox with its own zoom controls instead).
 *
 * The image renders with `object-contain`, so it can be letterboxed inside
 * its container (pillarboxed/letterboxed depending on aspect ratio) rather
 * than filling it edge-to-edge. The lens math accounts for that — it's
 * keyed off the image's actual rendered rect, not the container's, so
 * hovering over the letterbox padding correctly does nothing instead of
 * showing a skewed zoom.
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
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    setSupportsHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  useEffect(() => {
    setNaturalSize(null);
  }, [src]);

  // The actual on-screen rect of the image within its container, accounting
  // for object-contain letterboxing — same math the browser itself uses.
  const getImageRect = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    if (!naturalSize) return { left: 0, top: 0, width: rect.width, height: rect.height, containerRect: rect };

    const containerRatio = rect.width / rect.height;
    const imageRatio = naturalSize.w / naturalSize.h;
    let width = rect.width;
    let height = rect.height;
    if (imageRatio > containerRatio) {
      height = rect.width / imageRatio;
    } else {
      width = rect.height * imageRatio;
    }
    return { left: (rect.width - width) / 2, top: (rect.height - height) / 2, width, height, containerRect: rect };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = getImageRect();
    if (!img) return;

    const x = e.clientX - img.containerRect.left;
    const y = e.clientY - img.containerRect.top;

    if (x < img.left || x > img.left + img.width || y < img.top || y > img.top + img.height) {
      setActive(false);
      return;
    }
    setActive(true);
    setImageRect(img);

    const lensX = Math.min(Math.max(x - LENS_SIZE / 2, 0), img.containerRect.width - LENS_SIZE);
    const lensY = Math.min(Math.max(y - LENS_SIZE / 2, 0), img.containerRect.height - LENS_SIZE);
    setLensPos({ x: lensX, y: lensY });

    const fracX = (x - img.left) / img.width;
    const fracY = (y - img.top) / img.height;
    setBgPos({ x: fracX, y: fracY });
  };

  const bgWidth = imageRect.width * ZOOM;
  const bgHeight = imageRect.height * ZOOM;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseEnter={() => supportsHover && setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={supportsHover ? handleMouseMove : undefined}
    >
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={(e) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />

      {active && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-white shadow-warm ring-1 ring-black/10 overflow-hidden"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lensPos.x,
            top: lensPos.y,
            backgroundImage: `url(${src})`,
            backgroundSize: `${bgWidth}px ${bgHeight}px`,
            backgroundPosition: `${-(bgPos.x * bgWidth - LENS_SIZE / 2)}px ${-(bgPos.y * bgHeight - LENS_SIZE / 2)}px`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
}
