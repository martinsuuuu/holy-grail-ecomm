'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  useEffect(() => {
    // safety net in case autoplay is blocked and onEnded never fires
    const fallback = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(fallback);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!visible}
      onTransitionEnd={() => {
        if (!visible) setMounted(false);
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-cream transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={() => setVisible(false)}
        className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
      >
        <source src="/HG-Logo-Circle.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
