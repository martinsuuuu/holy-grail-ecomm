import type { ComponentType } from 'react';

// Minimal line-art glyphs for social platforms, drawn in the same
// stroke style as the lucide-react icon set used everywhere else in the
// app (24x24, round caps/joins, currentColor). Lucide dropped brand icons
// from its core set, so these are hand-drawn rather than pulled from a
// brand icon pack.

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v6h3v-6h2.5l.5-3H12V8a1 1 0 0 1 1-1h2Z" />
    </svg>
  );
}

export function PinterestIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 19c.5-2 1.5-6 1.5-6m0 0c-.4-.7-.5-2.5.6-3.5 1.4-1.2 3.4.1 3.4 2.2 0 1.7-1 3.3-2.4 3.3-.8 0-1.4-.6-1.6-1M9.5 19l1.5-6" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export interface SocialLink {
  label: string;
  Icon: ComponentType<IconProps>;
  href?: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Pinterest', Icon: PinterestIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
];
