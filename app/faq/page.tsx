import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const FAQS = [
  {
    q: 'How does checkout work?',
    a: "We use a deposit-based reservation system. Once you place an order, the items are reserved for 24 hours while you submit proof of your deposit. After we confirm the deposit, your order moves into processing and fulfillment. If proof isn't submitted in time, the reservation expires and the stock is released.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept GCash and direct bank transfer. Available payment methods and their QR codes/account details are shown at checkout — simply select one, complete the transfer, and upload your proof of payment.',
  },
  {
    q: 'What is a "Pasabuy" item?',
    a: "Pasabuy items are pieces we don't currently hold in stock but can source on your behalf. When you order a Pasabuy item, we begin sourcing it for you — the product page shows an expected arrival window so you know roughly when to expect it. Pasabuy items aren't subject to the same stock-reservation limits as on-hand items.",
  },
  {
    q: 'What delivery options are available?',
    a: 'At checkout you can choose Lalamove for same-day delivery within serviceable areas, Shopee Checkout for standard 2–3 business day delivery, or J&T Express for standard nationwide delivery. Delivery charges and estimated timelines are shown before you confirm your order.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes — once your order is confirmed, you can follow its status from your account\'s Order History page, from placement through processing, shipping, and delivery.',
  },
  {
    q: 'What is your return policy?',
    a: "Because we deal in curated, often one-of-a-kind luxury pieces, return eligibility is assessed case by case. If something isn't right with your order, please contact us directly and we'll work with you on next steps.",
  },
  {
    q: 'How do I save items for later?',
    a: 'Tap the heart icon on any product card or product page to add it to your Wishlist. You can review saved items anytime from the wishlist icon in the navigation bar.',
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">Support</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-10 leading-tight">
          Frequently Asked Questions
        </h1>

        <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-espresso">
                {item.q}
                <span className="ml-4 flex-shrink-0 text-espresso/40 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-espresso/60 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-sm text-espresso/50">
          Still have questions? <a href="/contact" className="text-espresso underline hover:text-espresso/70">Contact us</a> and we&apos;ll be happy to help.
        </p>
      </div>

      <Footer />
    </div>
  );
}
