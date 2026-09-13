'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_SITE_CONFIG, SiteConfig } from '@/lib/siteConfig';

export default function AnnouncementBar() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/site-config')
      .then((r) => r.json())
      .then((data: SiteConfig) => {
        setConfig(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !config.announcementEnabled || config.announcementMessages.length === 0) return null;

  const messages = config.announcementMessages.filter((m) => m.trim());
  if (messages.length === 0) return null;

  const track = [...messages, ...messages];

  return (
    <div className="bg-espresso text-cream overflow-hidden">
      <div className="flex whitespace-nowrap py-2 animate-marquee">
        {track.map((msg, i) => (
          <span key={i} className="text-xs tracking-wide px-8 flex-shrink-0">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
