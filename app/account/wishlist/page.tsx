'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useWishlistStore } from '@/lib/wishlistStore';
import { Heart, ArrowLeft } from 'lucide-react';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const items = useWishlistStore((state) => state.items);
  const loaded = useWishlistStore((state) => state.loaded);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user.role === 'CUSTOMER') fetchWishlist();
  }, [session?.user.role, fetchWishlist]);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-espresso/50 hover:text-espresso">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-display font-black text-espresso flex items-center gap-2">
            <Heart className="h-6 w-6" />
            My Wishlist
          </h1>
          {items.length > 0 && (
            <span className="bg-stone-100 text-espresso/70 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!loaded ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="h-4 bg-stone-200 rounded mt-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-display font-medium text-espresso mb-2">Your wishlist is empty</h3>
            <p className="text-espresso/50 text-sm mb-6">Save pieces you love and find them here anytime.</p>
            <Link href="/shop" className="btn-primary inline-block">Browse the Shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((entry) => (
              <ProductCard key={entry.id} product={entry.product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
