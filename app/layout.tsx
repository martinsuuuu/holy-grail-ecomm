import type { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/SessionProvider';
import StoreHydration from '@/components/StoreHydration';

const display = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
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

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-cream min-h-screen font-sans text-espresso">
        <SessionProvider session={session}>
          <StoreHydration />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
