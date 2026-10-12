'use client';

import { useEffect, useRef, useState } from 'react';

// The source video is a gold "HG" mark on solid black. `mix-blend-mode`
// doesn't reliably composite with <video> (hardware decode uses its own
// compositing layer in Chromium), so instead we draw each frame to a canvas
// and zero out the alpha on dark pixels — real per-pixel transparency that
// lets the site underneath show through around the logo.
function keyOutBlack(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const frame = ctx.getImageData(0, 0, width, height);
  const { data } = frame;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i + 3] = Math.max(0, Math.min(255, (luma - 12) * 8));
  }
  ctx.putImageData(frame, 0, 0);
}

export default function SplashScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  useEffect(() => {
    const fallback = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Belt-and-suspenders: some browsers won't honor the autoPlay attribute
    // reliably unless muted is also set as a DOM property before play() is
    // called explicitly.
    video.muted = true;
    video.play().catch(() => {});

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      if (video.videoWidth && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      if (canvas.width) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        keyOutBlack(ctx, canvas.width, canvas.height);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!visible}
      onTransitionEnd={() => {
        if (!visible) setMounted(false);
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={() => setVisible(false)}
        aria-hidden="true"
        className="absolute w-px h-px opacity-0 pointer-events-none"
      >
        <source src="/HG-Logo-Circle.mp4" type="video/mp4" />
      </video>
      <canvas ref={canvasRef} className="w-80 h-40 sm:w-96 sm:h-48" />
    </div>
  );
}
