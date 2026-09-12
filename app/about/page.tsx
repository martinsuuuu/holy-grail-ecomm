import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">About Us</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-8 leading-tight">
          Curated. Authenticated.<br />Crafted for forever.
        </h1>

        <div className="space-y-6 text-espresso/70 leading-relaxed">
          <p>
            Holy Grail is a curated destination for luxury handbags and accessories from the
            world&apos;s most recognized houses — Hermès, Chanel, Dior, Louis Vuitton, Gucci, and
            beyond. Every piece in our collection is selected for its craftsmanship, condition, and
            standing among collectors, so you can shop with confidence.
          </p>
          <p>
            We believe a great piece should feel effortless to find. Our team sources on-hand
            inventory ready to ship, and also offers Pasabuy — a pre-order service where we source
            specific pieces on your behalf when they aren&apos;t already in stock, with a clear
            expected-arrival window so you always know what to expect.
          </p>
          <p>
            From the first inquiry to the final handoff, our goal is a shopping experience that
            matches the standard of the pieces we carry: considered, transparent, and built on trust.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-stone-200 pt-10">
          <div>
            <p className="font-display font-black text-2xl text-espresso mb-1">Curated</p>
            <p className="text-sm text-espresso/60">Every piece hand-selected from trusted, recognized houses.</p>
          </div>
          <div>
            <p className="font-display font-black text-2xl text-espresso mb-1">Authenticated</p>
            <p className="text-sm text-espresso/60">Condition and provenance checked before it reaches you.</p>
          </div>
          <div>
            <p className="font-display font-black text-2xl text-espresso mb-1">Hand-Carried</p>
            <p className="text-sm text-espresso/60">Reserved, packed, and shipped with the same care throughout.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
