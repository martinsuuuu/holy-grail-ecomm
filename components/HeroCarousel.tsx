'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  category: string;
  name: string;
  imageUrl: string;
}

export default function HeroCarousel({ slides, bannerImage }: { slides: Slide[]; bannerImage?: string | null }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bannerImage || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, bannerImage]);

  // A custom uploaded banner overrides the auto-generated product carousel
  // with a single static image — no rotation, caption, or brand click-through.
  if (bannerImage) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${bannerImage}')` }}
      />
    );
  }

  if (slides.length === 0) return null;

  const goTo = (i: number) => setIndex((i + slides.length) % slides.length);
  const slide = slides[index];
  const goToBrand = () => router.push(`/shop?category=${encodeURIComponent(slide.category)}`);

  return (
    <>
      {/* Crossfading product images */}
      {slides.map((s, i) => (
        <div
          key={s.category}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-[center_25%] transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${s.imageUrl}')` }}
        />
      ))}

      {/* Clickable caption for the current slide */}
      <button
        onClick={goToBrand}
        className="group absolute bottom-24 sm:bottom-28 right-4 sm:right-10 z-10 text-right max-w-[220px]"
      >
        <p className="text-[11px] uppercase tracking-[0.25em] text-primary-300 mb-1">Now Featuring</p>
        <p className="font-display font-black text-2xl sm:text-3xl text-cream leading-tight group-hover:text-primary-200 transition-colors">
          {slide.category}
        </p>
        <p className="text-xs text-cream/60 mt-1 mb-2 truncate">{slide.name}</p>
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-primary-300 border-b border-primary-400/60 pb-0.5 group-hover:text-primary-200 group-hover:border-primary-200 transition-colors">
          Shop {slide.category}
        </span>
      </button>

      {/* Prev / next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Previous brand"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/25 backdrop-blur-sm flex items-center justify-center text-cream transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Next brand"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-cream/10 hover:bg-cream/25 backdrop-blur-sm flex items-center justify-center text-cream transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.category}
                onClick={() => goTo(i)}
                aria-label={`Show ${s.category}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-primary-400' : 'w-1.5 bg-cream/40 hover:bg-cream/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
