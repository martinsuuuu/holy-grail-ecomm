import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-10 mt-10 border-t border-stone-200">
      <h2 className="font-display font-black text-2xl sm:text-3xl text-espresso mb-4">{title}</h2>
      <div className="space-y-4 text-espresso/70 leading-relaxed text-sm">{children}</div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display font-bold text-lg text-espresso pt-2">{children}</h3>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">About Us</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-8 leading-tight">
          The Pursuit of Perfection:<br />The Story of Holygrail Inc.
        </h1>

        <div className="space-y-4 text-espresso/70 leading-relaxed text-sm">
          <p>
            In the world of high-end fashion, the term <strong className="text-espresso">&ldquo;Holy
            Grail&rdquo;</strong> represents something rare and deeply sought after — a singular piece
            distinguished by its scarcity, craftsmanship, history, and character. It may be a Birkin in
            a discontinued colorway, a limited-edition Kelly, a rare vintage piece, or a collectible
            that has become increasingly difficult to find.
          </p>
          <p>
            For <strong className="text-espresso">Holygrail Inc.</strong>, the pursuit of these
            exceptional pieces is at the heart of what we do. We transform the search for rare and
            distinctive luxury into a refined experience centered on discovery, authenticity, and
            exceptional service.
          </p>
        </div>

        <Section title="A Heritage of Precision: From Osaka to the World">
          <p>
            The story of Holygrail Inc. began in <strong className="text-espresso">2017 in Osaka,
            Japan</strong>, a city with a longstanding presence in the pre-owned luxury market and a
            culture known for meticulous attention to detail and hospitality.
          </p>
          <p>
            From the beginning, our mission was clear: to build a collection that would appeal to
            discerning collectors and enthusiasts seeking exceptional pieces beyond the conventional
            retail offering.
          </p>
          <p>
            Rather than focusing solely on volume, Holygrail developed its identity around{' '}
            <strong className="text-espresso">rarity, condition, craftsmanship, and individuality</strong>.
            The Japanese market provided an important foundation for our approach to merchandise
            evaluation, presentation, and customer service.
          </p>
          <p>
            Over the years, our collection evolved to include carefully selected pieces from some of the
            world&apos;s most recognized luxury houses, with a particular appreciation for items that
            possess distinctive histories, discontinued designs, uncommon materials, or limited
            availability.
          </p>
        </Section>

        <Section title="The Architecture of Rarity: Our Luxury Collection">
          <p>
            We believe that a luxury item can be more than a functional possession. It can represent
            craftsmanship, design, history, personal expression, and a connection to a particular era of
            fashion.
          </p>
          <p>Our sourcing philosophy focuses on identifying pieces that stand apart from the ordinary retail cycle, including:</p>
          <List
            items={[
              <><strong className="text-espresso">Rare and Distinctive Pieces</strong> — Hard-to-find designs, colors, materials, and configurations sought after by collectors.</>,
              <><strong className="text-espresso">Discontinued Classics</strong> — Selected pieces from past collections that are no longer part of current retail offerings.</>,
              <><strong className="text-espresso">Limited Editions and Collaborations</strong> — Special releases, collaborations, and distinctive pieces associated with important moments in fashion history.</>,
              <><strong className="text-espresso">Vintage Treasures</strong> — Carefully selected vintage merchandise appreciated for its character, craftsmanship, and historical significance.</>,
            ]}
          />
          <p>Our collection spans renowned maisons such as <strong className="text-espresso">Hermès, Chanel, Louis Vuitton</strong>, and other internationally recognized luxury houses.</p>
          <p>Every item is carefully reviewed and documented as part of our merchandise handling and inspection process, with attention to condition, details, materials, accessories, and overall presentation.</p>
          <p>At Holygrail, we do not simply offer luxury merchandise. We seek to create a collection where every piece has a reason to be discovered.</p>
        </Section>

        <Section title="A New Horizon: The Philippine Chapter">
          <p>
            After establishing its roots in Japan, Holygrail Inc. enters a new chapter with its presence
            in the <strong className="text-espresso">Philippines</strong>.
          </p>
          <p>
            The Philippines is home to a growing community of luxury enthusiasts and collectors with an
            appreciation for craftsmanship, heritage, design, and individuality. Our Philippine presence
            allows us to bring the Holygrail experience closer to clients while continuing to draw upon
            our international sourcing perspective.
          </p>
          <p>
            This expansion also represents an evolution of the Holygrail concept — from a focus on
            exceptional handbags toward a broader <strong className="text-espresso">luxury lifestyle
            collection</strong>.
          </p>
          <p>
            Our Japanese roots remain an important part of our identity, while our Philippine chapter
            allows us to develop a distinctly local client experience built around personalized service,
            carefully selected merchandise, and a commitment to professional luxury retail.
          </p>
        </Section>

        <Section title="The Evolution of the Collection: Beyond the Bag">
          <p>As the modern luxury collector&apos;s interests continue to evolve, so does Holygrail Inc.</p>
          <p>Our Philippine collection extends beyond handbags to include carefully selected categories that complement the world of luxury fashion.</p>

          <SubHeading>1. Luxury Apparel</SubHeading>
          <p>Style extends beyond accessories.</p>
          <p>Our apparel collection features selected ready-to-wear pieces from internationally recognized fashion houses, with an emphasis on distinctive design, quality materials, craftsmanship, and timeless appeal.</p>
          <p>From vintage Chanel pieces to contemporary designer garments, each selection is chosen to complement the sophisticated wardrobe of the modern collector.</p>

          <SubHeading>2. Haute Horology</SubHeading>
          <p className="font-semibold text-espresso">Time is an expression of craftsmanship.</p>
          <p>Our watch collection introduces clients to the world of fine mechanical timepieces, featuring selected models from renowned watchmakers.</p>
          <p>From iconic Rolex designs to the sophisticated complications of houses such as <strong className="text-espresso">Patek Philippe</strong> and <strong className="text-espresso">Audemars Piguet</strong>, our selection focuses on craftsmanship, design, heritage, and collectibility.</p>

          <SubHeading>3. Fine Jewelry</SubHeading>
          <p className="font-semibold text-espresso">The finishing touch to a truly exceptional collection.</p>
          <p>Our jewelry selection features carefully chosen pieces from internationally recognized maisons, encompassing distinctive designs, precious materials, and enduring craftsmanship.</p>
          <p>From Cartier creations to Van Cleef &amp; Arpels&apos; celebrated designs, our collection is curated for clients who appreciate jewelry not only as an expression of personal style, but also as part of a broader appreciation for luxury craftsmanship and design.</p>
        </Section>

        <Section title="The Destination: Unit 2Y, Lee Gardens">
          <p>We invite you to experience the next chapter of Holygrail Inc. in person.</p>
          <p>Our Philippine location has been created as a private and welcoming environment where clients can explore our collection at their own pace, receive personalized assistance, and discover pieces selected for their individuality and character.</p>
          <div className="not-italic">
            <p className="font-semibold text-espresso">Holygrail Inc.</p>
            <p>Unit 2Y, Lee Gardens Condominium</p>
            <p>Lee St. cor. Shaw Boulevard</p>
            <p>Brgy. Wack Wack, Mandaluyong City</p>
            <p>Philippines</p>
          </div>
          <p>Located in Wack Wack, Mandaluyong City, our boutique provides a more intimate alternative to the conventional shopping environment.</p>
          <p>Clients may arrange personalized consultations and private viewings of selected pieces, allowing the experience to remain focused on discovery, service, and individual preferences.</p>
        </Section>

        <Section title="Our Promise: The Holygrail Standard">
          <p>As Holygrail Inc. grows, our commitment remains grounded in the principles that have shaped our journey from the beginning.</p>

          <SubHeading>Authenticity and Transparency</SubHeading>
          <p>We are committed to responsible sourcing, careful merchandise inspection, and transparent communication regarding the condition and characteristics of our products.</p>

          <SubHeading>The Personal Touch</SubHeading>
          <p>We understand that acquiring a significant luxury piece can be a personal experience. Our team strives to provide attentive service and relevant product knowledge so clients can make informed purchasing decisions.</p>

          <SubHeading>Attention to Detail</SubHeading>
          <p>From sourcing and inspection to presentation, packaging, and delivery, we approach every stage of the customer experience with care and professionalism.</p>

          <SubHeading>Global Perspective, Local Presence</SubHeading>
          <p>Our sourcing perspective extends beyond borders, while our Philippine presence provides a local destination where collectors and luxury enthusiasts can discover and experience exceptional merchandise.</p>
        </Section>

        <div className="pt-10 mt-10 border-t border-stone-200">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-espresso mb-4">The Holygrail Journey</h2>
          <div className="space-y-4 text-espresso/70 leading-relaxed text-sm">
            <p>Since <strong className="text-espresso">2017</strong>, Holygrail Inc. has continued to pursue a simple idea: that extraordinary pieces deserve an equally considered experience.</p>
            <p>From our beginnings in <strong className="text-espresso">Osaka, Japan</strong>, to our presence in <strong className="text-espresso">Mandaluyong City, Philippines</strong>, our journey continues to be shaped by a passion for rarity, craftsmanship, heritage, and the enduring appeal of exceptional luxury.</p>
            <p>Because sometimes, the piece you have been searching for is not simply another addition to a collection.</p>
            <p className="font-semibold text-espresso text-base">It is the Holy Grail.</p>
          </div>
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
