'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Globe, Share2 } from 'lucide-react';
import HGMonogram from './HGMonogram';
import { DEFAULT_SITE_CONFIG, SiteConfig, THEME_TEXTURE_URL } from '@/lib/siteConfig';

interface Category {
  id: string;
  name: string;
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/site-config').then((r) => r.json()).then(setConfig).catch(() => {});
    fetch('/api/categories').then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <footer
      className="bg-espresso text-cream mt-16 bg-cover bg-center"
      style={config.themeTextureEnabled ? { backgroundImage: `url('${THEME_TEXTURE_URL}')` } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Newsletter */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <HGMonogram className="h-8 w-8" />
            <span className="font-display font-black text-lg tracking-wide">HOLY GRAIL</span>
          </div>
          <p className="text-sm text-cream/60 mb-4">
            {config.footerTagline}
          </p>
          {subscribed ? (
            <p className="text-sm text-primary-300">Thanks — you&apos;re on the list.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2 mb-6">
              <input
                type="email"
                required
                placeholder="Email Address *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full text-sm text-espresso border-0 focus:outline-none focus:ring-2 focus:ring-cream/60"
              />
              <button type="submit" className="w-full py-2.5 rounded-full bg-cream text-espresso text-sm font-semibold hover:bg-primary-100 transition-colors">
                Let&apos;s keep in touch
              </button>
            </form>
          )}
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full border border-cream/30 flex items-center justify-center text-cream/60">
              <Globe className="h-4 w-4" />
            </span>
            <span className="w-8 h-8 rounded-full border border-cream/30 flex items-center justify-center text-cream/60">
              <Share2 className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* About */}
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest mb-4">About</h4>
          <ul className="space-y-2 text-sm text-cream/60">
            <li><Link href="/about" className="hover:text-cream transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-cream transition-colors">Visit Us</Link></li>
          </ul>
          <div className="mt-4 space-y-1 text-sm text-cream/60">
            <p>By appointment only</p>
            <p>10am – 7pm (GMT+8)</p>
            <p>Metro Manila, Philippines</p>
          </div>
        </div>

        {/* Shop — real brand categories */}
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-cream/60">
            <li><Link href="/shop" className="hover:text-cream transition-colors">All Products</Link></li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/shop?category=${encodeURIComponent(cat.name)}`} className="hover:text-cream transition-colors">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest mb-4">Help</h4>
          <ul className="space-y-2 text-sm text-cream/60">
            <li><Link href="/faq" className="hover:text-cream transition-colors">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-cream transition-colors">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-cream transition-colors">Return Policy</Link></li>
            <li><Link href="/shop" className="hover:text-cream transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6 text-center text-xs text-cream/40">
        © Holy Grail {new Date().getFullYear()}. Demo storefront — not affiliated with any third-party business.
      </div>
    </footer>
  );
}
