'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Slide {
  image: string;
  eyebrow?: string;
  caption?: string;
  subcaption?: string;
  /** Optional click-through, e.g. "/shop?category=Chanel". Omit for a non-clickable slide. */
  href?: string;
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  if (slides.length === 0) return null;

  // `slides` can shrink between renders (e.g. the auto-generated brand
  // carousel swapping for a shorter custom slide list once site config
  // loads) — clamp instead of trusting stale `index` state to stay in range.
  const safeIndex = index % slides.length;
  const goTo = (i: number) => setIndex((i + slides.length) % slides.length);
  const slide = slides[safeIndex];
  const hasCaption = Boolean(slide.eyebrow || slide.caption || slide.subcaption);

  const caption = hasCaption && (
    <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-10 z-10 text-right max-w-[220px]">
      {slide.eyebrow && <p className="text-[11px] uppercase tracking-[0.25em] text-primary-300 mb-1">{slide.eyebrow}</p>}
      {slide.caption && (
        <p className="font-display font-black text-2xl sm:text-3xl text-cream leading-tight group-hover:text-primary-200 transition-colors">
          {slide.caption}
        </p>
      )}
      {slide.subcaption && <p className="text-xs text-cream/60 mt-1 mb-2 truncate">{slide.subcaption}</p>}
      {slide.href && slide.caption && (
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-primary-300 border-b border-primary-400/60 pb-0.5 group-hover:text-primary-200 group-hover:border-primary-200 transition-colors">
          Shop {slide.caption}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Crossfading slide images */}
      {slides.map((s, i) => (
        <div
          key={i}
          aria-hidden={i !== safeIndex}
          className={`absolute inset-0 bg-cover bg-[center_25%] transition-opacity duration-1000 ease-in-out ${
            i === safeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${s.image}')` }}
        />
      ))}

      {/* Clickable caption for the current slide */}
      {slide.href ? (
        <button onClick={() => router.push(slide.href!)} className="group contents">
          {caption}
        </button>
      ) : (
        caption
      )}

      {/* Prev / next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(safeIndex - 1)}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/25 backdrop-blur-sm flex items-center justify-center text-cream transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => goTo(safeIndex + 1)}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/25 backdrop-blur-sm flex items-center justify-center text-cream transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === safeIndex ? 'w-6 bg-primary-400' : 'w-1.5 bg-cream/40 hover:bg-cream/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
