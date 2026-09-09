import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Truck } from 'lucide-react';
import HGMonogram from '@/components/HGMonogram';

export default async function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SHIPPER') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Shipper Navbar */}
      <nav className="bg-white border-b border-stone-200/70 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-espresso rounded-full flex items-center justify-center">
                <HGMonogram className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <span className="font-display font-semibold text-espresso">Holy Grail</span>
                <span className="text-xs text-primary-700 ml-2 font-medium">Shipper Panel</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-espresso/60">{session.user.name}</span>
              <Link
                href="/api/auth/signout"
                className="flex items-center gap-1.5 text-sm text-espresso/50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
