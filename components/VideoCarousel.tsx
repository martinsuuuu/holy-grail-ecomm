'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { VideoItem } from '@/lib/siteConfig';

function VideoCard({ video }: { video: VideoItem }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    ref.current?.play().catch(() => {});
  };

  return (
    <div className="relative flex-shrink-0 w-[280px] sm:w-[320px] snap-start rounded-2xl overflow-hidden bg-espresso shadow-soft aspect-[9/16]">
      <video
        ref={ref}
        src={video.url}
        controls={playing}
        playsInline
        preload="metadata"
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!playing && (
        <button
          onClick={handlePlay}
          aria-label={`Play ${video.title}`}
          className="absolute inset-0 flex flex-col items-center justify-end p-4 text-left bg-gradient-to-t from-espresso/90 via-espresso/10 to-transparent"
        >
          <span className="w-14 h-14 rounded-full bg-cream/90 flex items-center justify-center mb-auto mt-auto group-hover:scale-105 transition-transform">
            <Play className="h-5 w-5 text-espresso ml-0.5" fill="currentColor" />
          </span>
          <div className="w-full">
            <p className="font-display font-bold text-cream text-sm">{video.title}</p>
            <p className="text-cream/60 text-xs mt-0.5 line-clamp-2">{video.caption}</p>
          </div>
        </button>
      )}
    </div>
  );
}

export default function VideoCarousel({ videos }: { videos: VideoItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

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
          <VideoCard key={v.id} video={v} />
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
    </div>
  );
}
