'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, X, Volume2 } from 'lucide-react';
import { VideoItem } from '@/lib/siteConfig';

function VideoCard({ video, onSelect }: { video: VideoItem; onSelect: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleEnter = () => {
    setHovering(true);
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  const handleLeave = () => {
    setHovering(false);
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <button
      type="button"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onSelect}
      aria-label={`Play ${video.title} fullscreen`}
      className="relative flex-shrink-0 w-[280px] sm:w-[320px] snap-start rounded-2xl overflow-hidden bg-espresso shadow-soft aspect-[9/16] text-left group cursor-pointer"
    >
      <video
        ref={ref}
        src={video.url}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className={`absolute inset-0 flex flex-col items-center justify-end p-4 bg-gradient-to-t from-espresso/90 via-espresso/10 to-transparent transition-opacity ${
          hovering ? 'opacity-70' : 'opacity-100'
        }`}
      >
        <span className="w-14 h-14 rounded-full bg-cream/90 flex items-center justify-center mb-auto mt-auto group-hover:scale-110 transition-transform">
          <Play className="h-5 w-5 text-espresso ml-0.5" fill="currentColor" />
        </span>
        <div className="w-full">
          <p className="font-display font-bold text-cream text-sm">{video.title}</p>
          <p className="text-cream/60 text-xs mt-0.5 line-clamp-2">{video.caption}</p>
        </div>
      </div>
      {hovering && (
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-espresso/70 text-cream/90 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full">
          <Volume2 className="h-3 w-3" /> Muted preview
        </span>
      )}
    </button>
  );
}

function FullscreenPlayer({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.play().catch(() => {});
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="relative w-full h-full sm:w-auto sm:h-[90vh] sm:max-w-3xl flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={ref}
          src={video.url}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-full w-full h-full sm:h-[80vh] object-contain bg-black"
        />
        <div className="w-full px-2 pt-4 text-left">
          <p className="font-display font-bold text-cream text-base">{video.title}</p>
          <p className="text-cream/60 text-sm mt-1">{video.caption}</p>
        </div>
      </div>
    </div>
  );
}

export default function VideoCarousel({ videos }: { videos: VideoItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<VideoItem | null>(null);

  const scrollBy = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  if (videos.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} onSelect={() => setActive(v)} />
        ))}
      </div>
      {videos.length > 1 && (
        <>
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-warm items-center justify-center text-espresso hover:bg-primary-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-warm items-center justify-center text-espresso hover:bg-primary-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      {active && <FullscreenPlayer video={active} onClose={() => setActive(null)} />}
    </div>
  );
}
