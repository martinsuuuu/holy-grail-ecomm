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

export interface FontPairing {
  id: string;
  name: string;
  description: string;
  cssVar: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: 'bold', name: 'Bold Editorial', description: 'Archivo Black + Inter — the current look', cssVar: '--font-archivo' },
  { id: 'luxury', name: 'Classic Luxury', description: 'Playfair Display serif + Inter', cssVar: '--font-playfair' },
  { id: 'minimal', name: 'Modern Minimal', description: 'Poppins + Inter', cssVar: '--font-poppins' },
];

export interface SiteConfig {
  themePresetId: string;
  fontPairingId: string;
  announcementEnabled: boolean;
  announcementMessages: string[];
  showBrandGrid: boolean;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  /** Custom uploaded hero banner (data URL). When set, overrides the
   *  auto-generated per-brand product carousel with a single static image. */
  heroBannerImage: string | null;
  footerTagline: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  themePresetId: 'emerald-gold',
  fontPairingId: 'bold',
  announcementEnabled: true,
  announcementMessages: [
    'Free authentication on every piece',
    'New arrivals added weekly',
    'Pasabuy pre-orders now open',
  ],
  showBrandGrid: true,
  heroEyebrow: 'Curated. Authenticated.',
  heroHeadline: 'HOLY GRAIL',
  heroSubtext: "From the first mile to the final arrival — discover great deals across all our categories.",
  heroBannerImage: null,
  footerTagline: 'Sign up to receive exclusive content and updates on new arrivals.',
};

/** Max accepted upload size for the hero banner image, in bytes. Kept small
 *  since the image is stored inline as a base64 data URL in site_config,
 *  which is fetched on every page (footer/announcement bar included). */
export const MAX_BANNER_IMAGE_BYTES = 1_200_000;

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export function getFontPairing(id: string): FontPairing {
  return FONT_PAIRINGS.find((f) => f.id === id) ?? FONT_PAIRINGS[0];
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
