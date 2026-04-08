import type { Metadata } from 'next';
import './globals.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/SessionProvider';
import StoreHydration from '@/components/StoreHydration';

export const metadata: Metadata = {
  title: 'Little-Mija',
  description: 'Shop the best products at great prices',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <SessionProvider session={session}>
          <StoreHydration />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
