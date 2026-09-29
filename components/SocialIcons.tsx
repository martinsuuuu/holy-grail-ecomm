import type { ComponentType } from 'react';

// Minimal line-art glyphs for social platforms, drawn in the same
// stroke style as the lucide-react icon set used everywhere else in the
// app (24x24, round caps/joins). Lucide dropped brand icons from its
// core set, so these are hand-drawn rather than pulled from a brand icon
// pack. Each icon carries its own brand color (rather than inheriting
// currentColor) so it reads correctly on both light and dark backgrounds.

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <defs>
        <linearGradient id="ig-brand-gradient" x1="1" y1="23" x2="23" y2="1">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="28%" stopColor="#FA7E1E" />
          <stop offset="52%" stopColor="#D62976" />
          <stop offset="76%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#ig-brand-gradient)" strokeWidth={2.75} />
      <circle cx="12" cy="12" r="4" stroke="url(#ig-brand-gradient)" strokeWidth={2.75} />
      <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-brand-gradient)" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v6h3v-6h2.5l.5-3H12V8a1 1 0 0 1 1-1h2Z" />
    </svg>
  );
}

export function PinterestIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 19c.5-2 1.5-6 1.5-6m0 0c-.4-.7-.5-2.5.6-3.5 1.4-1.2 3.4.1 3.4 2.2 0 1.7-1 3.3-2.4 3.3-.8 0-1.4-.6-1.6-1M9.5 19l1.5-6" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5z" fill="#FF0000" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.4 3.9v11.2a3.8 3.8 0 1 1-3.8-3.8c.3 0 .6 0 .9.08" stroke="#FE2C55" strokeWidth={2.75} />
      <path d="M14 3.5c.4 2.9 2.5 5.1 5.4 5.4" stroke="#25F4EE" strokeWidth={2.75} />
    </svg>
  );
}

export interface SocialLink {
  label: string;
  Icon: ComponentType<IconProps>;
  href?: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Instagram', Icon: InstagramIcon, href: 'https://www.instagram.com/holygrailphilippines?igsh=Ync4NTBzbGIwN3Nw' },
  { label: 'Facebook', Icon: FacebookIcon, href: 'https://www.facebook.com/share/1LmUTQyrUH/?mibextid=wwXIfr' },
  { label: 'TikTok', Icon: TikTokIcon, href: 'https://www.tiktok.com/@holy.grail79?_r=1&_t=ZS-9A7xIcXETVh' },
];
