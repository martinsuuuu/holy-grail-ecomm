import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchSiteConfig } from '@/lib/siteConfigServer';

export default async function FaqPage() {
  const config = await fetchSiteConfig();

  // Group while preserving first-seen order of each category (uploaded
  // docs list questions in category blocks, so this naturally mirrors that).
  const groups: { category: string; items: typeof config.faqs }[] = [];
  for (const item of config.faqs) {
    const existing = groups.find((g) => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ category: item.category, items: [item] });
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">Support</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-6 leading-tight">
          Frequently Asked Questions
        </h1>
        {config.faqIntro && (
          <p className="text-espresso/60 leading-relaxed mb-10">{config.faqIntro}</p>
        )}

        {groups.map((group) => (
          <div key={group.category || 'general'} className="mb-10 last:mb-0">
            {group.category && (
              <h2 className="font-display font-bold text-lg text-espresso mb-2">{group.category}</h2>
            )}
            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {group.items.map((item) => (
                <details key={item.id} className="group py-5">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-espresso">
                    {item.question}
                    <span className="ml-4 flex-shrink-0 text-espresso/40 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-espresso/60 text-sm leading-relaxed whitespace-pre-line">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))}

        <p className="mt-2 text-sm text-espresso/50">
          Still have questions? <a href="/contact" className="text-espresso underline hover:text-espresso/70">Contact us</a> and we&apos;ll be happy to help.
        </p>
      </div>

      <Footer />
    </div>
  );
}
