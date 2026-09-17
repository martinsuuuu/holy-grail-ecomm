// Client-safe constants and types for the site theme/content editor.
// No database imports here — this file is imported by client components
// (admin editor UI, Navbar, Footer) as well as the server layout.

export type PrimaryScale = Record<
  '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
  string
>;

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  swatches: [string, string, string]; // [espresso, primary500, cream] for the preview chip
  colors: {
    primary: PrimaryScale;
    espresso: string;
    cream: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald-gold',
    name: 'Emerald & Gold',
    description: "Holy Grail's signature deep green and gold",
    swatches: ['#0B3D2E', '#C6A15B', '#FFFFFF'],
    colors: {
      primary: {
        '50': '#FBF7F0', '100': '#F6EDDC', '200': '#ECDBB5', '300': '#DFC48A', '400': '#D3AF6C',
        '500': '#C6A15B', '600': '#B08A45', '700': '#8F6E37', '800': '#6E552C', '900': '#524121',
      },
      espresso: '#0B3D2E',
      cream: '#FFFFFF',
    },
  },
  {
    id: 'midnight-gold',
    name: 'Midnight & Gold',
    description: 'High-contrast black and gold editorial',
    swatches: ['#111111', '#C6A15B', '#FFFFFF'],
    colors: {
      primary: {
        '50': '#FBF7F0', '100': '#F6EDDC', '200': '#ECDBB5', '300': '#DFC48A', '400': '#D3AF6C',
        '500': '#C6A15B', '600': '#B08A45', '700': '#8F6E37', '800': '#6E552C', '900': '#524121',
      },
      espresso: '#111111',
      cream: '#FFFFFF',
    },
  },
  {
    id: 'burgundy-rosegold',
    name: 'Burgundy & Rose Gold',
    description: 'Deep wine with warm rose-gold accents',
    swatches: ['#5C1A32', '#C07752', '#FFFBF9'],
    colors: {
      primary: {
        '50': '#FBF3F0', '100': '#F5E2DB', '200': '#E8C3B4', '300': '#D9A48C', '400': '#CC8B6C',
        '500': '#C07752', '600': '#A6613F', '700': '#854D33', '800': '#653A26', '900': '#452919',
      },
      espresso: '#5C1A32',
      cream: '#FFFBF9',
    },
  },
  {
    id: 'navy-champagne',
    name: 'Navy & Champagne',
    description: 'Deep navy with soft champagne highlights',
    swatches: ['#101F3A', '#C6A756', '#FFFFFF'],
    colors: {
      primary: {
        '50': '#FBF9F2', '100': '#F5EFDC', '200': '#E9DCB4', '300': '#DCC88C', '400': '#D2B96E',
        '500': '#C6A756', '600': '#A88C43', '700': '#836B35', '800': '#615027', '900': '#40361A',
      },
      espresso: '#101F3A',
      cream: '#FFFFFF',
    },
  },
  {
    id: 'charcoal-silver',
    name: 'Charcoal & Silver',
    description: 'Understated charcoal with platinum tones',
    swatches: ['#232323', '#9A9A89', '#FFFFFF'],
    colors: {
      primary: {
        '50': '#F7F7F6', '100': '#EDEDEA', '200': '#D9D9D2', '300': '#C3C3B8', '400': '#AEAE9F',
        '500': '#9A9A89', '600': '#7E7E6F', '700': '#626255', '800': '#47473D', '900': '#2C2C26',
      },
      espresso: '#232323',
      cream: '#FFFFFF',
    },
  },
];

/** A font that can independently be picked for headings or body text. All
 *  four are always loaded (see app/layout.tsx) so switching is instant —
 *  no extra network fetch. */
export interface FontOption {
  id: string;
  name: string;
  description: string;
  cssVar: string;
  /** Tailwind class used only to render this option's own label in the picker. */
  previewClass: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'archivo', name: 'Archivo', description: 'Bold geometric sans-serif', cssVar: '--font-archivo', previewClass: 'font-black' },
  { id: 'playfair', name: 'Playfair Display', description: 'Classic editorial serif', cssVar: '--font-playfair', previewClass: 'font-bold' },
  { id: 'poppins', name: 'Poppins', description: 'Modern geometric sans-serif', cssVar: '--font-poppins', previewClass: 'font-bold' },
  { id: 'inter', name: 'Inter', description: 'Clean neutral sans-serif', cssVar: '--font-body', previewClass: 'font-semibold' },
];

/** One slide of the shop hero carousel. When `image` is empty, the site
 *  falls back to auto-sampling one product photo per brand/category —
 *  see app/shop/page.tsx. */
export interface HeroSlide {
  id: string;
  image: string | null;
  eyebrow: string;
  caption: string;
  subcaption: string;
  /** Optional click-through, e.g. "/shop?category=Chanel". Blank = not clickable. */
  link: string;
}

export interface TrustItem {
  label: string;
  desc: string;
}

export interface SiteConfig {
  themePresetId: string;
  headingFontId: string;
  bodyFontId: string;
  announcementEnabled: boolean;
  announcementMessages: string[];

  // Shop hero
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  /** Custom carousel slides. Empty = auto-generated from product photos. */
  heroSlides: HeroSlide[];

  // Trust strip (4 fixed icons: ShieldCheck, Lock, Truck, MessageCircle)
  trustItems: TrustItem[];

  // Personal sourcing / concierge section
  sourcingEyebrow: string;
  sourcingHeadline: string;
  sourcingText: string;
  sourcingImage: string;

  // Shop by brand grid
  showBrandGrid: boolean;
  brandGridEyebrow: string;
  brandGridHeading: string;
  brandGridSubheading: string;

  // Bottom "Experience" CTA section
  ctaEyebrow: string;
  ctaHeadline: string;
  ctaText: string;

  footerTagline: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  themePresetId: 'emerald-gold',
  headingFontId: 'archivo',
  bodyFontId: 'inter',
  announcementEnabled: true,
  announcementMessages: [
    'Free authentication on every piece',
    'New arrivals added weekly',
    'Pasabuy pre-orders now open',
  ],

  heroEyebrow: 'Curated. Authenticated.',
  heroHeadline: 'HOLY GRAIL',
  heroSubtext: "From the first mile to the final arrival — discover great deals across all our categories.",
  heroSlides: [],

  trustItems: [
    { label: 'Authenticity Checked', desc: 'Condition & provenance verified' },
    { label: 'Secure Reservation', desc: 'Deposit-based checkout' },
    { label: 'Pasabuy Sourcing', desc: 'We source it on request' },
    { label: 'Sales Concierge', desc: 'Personal assistance, always' },
  ],

  sourcingEyebrow: 'Personal Sourcing',
  sourcingHeadline: "Can't Find the Piece You Want?",
  sourcingText: "Our Pasabuy service sources specific pieces on your behalf when they're not already in stock, backed by a dedicated sales concierge from inquiry to delivery.",
  sourcingImage: 'https://images.unsplash.com/photo-1589731119540-c4586781dae1?w=1000&q=80',

  showBrandGrid: true,
  brandGridEyebrow: 'Maisons',
  brandGridHeading: 'Shop by Brand',
  brandGridSubheading: 'Curated houses, authenticated pieces',

  ctaEyebrow: 'Every Order',
  ctaHeadline: 'The Holy Grail Experience',
  ctaText: 'Every order is backed by the same standard of care, from first inquiry to final delivery.',

  footerTagline: 'Sign up to receive exclusive content and updates on new arrivals.',
};

/** Max accepted upload size per image, in bytes. Kept small since images are
 *  stored inline as base64 data URLs in site_config, which is fetched on
 *  every page (footer/announcement bar included). */
export const MAX_IMAGE_BYTES = 900_000;

/** Hard cap on the number of custom hero slides an admin can add, so the
 *  site_config payload (fetched on every page load) can't grow unbounded. */
export const MAX_HERO_SLIDES = 6;

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export function getFontOption(id: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

export function mergeSiteConfig(partial: Partial<SiteConfig> | null | undefined): SiteConfig {
  return { ...DEFAULT_SITE_CONFIG, ...(partial ?? {}) };
}

/** Converts "#RRGGBB" to a space-separated "R G B" triple for Tailwind's
 *  `rgb(var(--x) / <alpha-value>)` opacity-modifier color format. */
export function hexToRgbTriple(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}
