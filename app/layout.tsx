import type { Metadata } from 'next';
import { Archivo, Playfair_Display, Poppins, Inter } from 'next/font/google';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/SessionProvider';
import StoreHydration from '@/components/StoreHydration';
import { fetchSiteConfig } from '@/lib/siteConfigServer';
import { getThemePreset, getFontPairing, hexToRgbTriple } from '@/lib/siteConfig';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Holy Grail',
  description: 'Shop the best products at great prices',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const config = await fetchSiteConfig();
  const preset = getThemePreset(config.themePresetId);
  const font = getFontPairing(config.fontPairingId);

  const themeStyle = {
    '--color-primary-50-rgb': hexToRgbTriple(preset.colors.primary['50']),
    '--color-primary-100-rgb': hexToRgbTriple(preset.colors.primary['100']),
    '--color-primary-200-rgb': hexToRgbTriple(preset.colors.primary['200']),
    '--color-primary-300-rgb': hexToRgbTriple(preset.colors.primary['300']),
    '--color-primary-400-rgb': hexToRgbTriple(preset.colors.primary['400']),
    '--color-primary-500-rgb': hexToRgbTriple(preset.colors.primary['500']),
    '--color-primary-600-rgb': hexToRgbTriple(preset.colors.primary['600']),
    '--color-primary-700-rgb': hexToRgbTriple(preset.colors.primary['700']),
    '--color-primary-800-rgb': hexToRgbTriple(preset.colors.primary['800']),
    '--color-primary-900-rgb': hexToRgbTriple(preset.colors.primary['900']),
    '--color-espresso-rgb': hexToRgbTriple(preset.colors.espresso),
    '--color-cream-rgb': hexToRgbTriple(preset.colors.cream),
    '--font-display': `var(${font.cssVar})`,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${playfair.variable} ${poppins.variable} ${body.variable}`}
      style={themeStyle}
    >
      <body className="bg-cream min-h-screen font-sans text-espresso">
        <SessionProvider session={session}>
          <StoreHydration />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
