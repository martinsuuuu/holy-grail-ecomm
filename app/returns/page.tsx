import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-10 mt-10 border-t border-stone-200 first:pt-0 first:mt-0 first:border-0">
      <h2 className="font-display font-black text-2xl text-espresso mb-4">{title}</h2>
      <div className="space-y-4 text-espresso/70 leading-relaxed text-sm">{children}</div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display font-bold text-base text-espresso pt-2">{children}</h3>;
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

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">Policies</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-8 leading-tight">
          Return Policy
        </h1>

        <p className="text-espresso/70 leading-relaxed text-sm mb-2">
          At <strong className="text-espresso">Holygrail Inc.</strong>, we take pride in the quality,
          authenticity, and condition of our curated luxury merchandise. As our inventory consists of
          high-value, rare, and, in many cases, one-of-a-kind pieces, we maintain a careful inspection
          and return process designed to protect our clients and preserve the integrity of our
          merchandise.
        </p>

        <Section title="1. Pre-Shipment Confirmation — Basis of Sale">
          <p>
            To promote transparency and ensure that clients are fully informed of an item&apos;s
            condition before shipment, Holygrail Inc. follows a pre-shipment verification process:
          </p>
          <List
            items={[
              <>
                <strong className="text-espresso">Condition Documentation:</strong> Before an item is
                shipped, Holygrail Inc. may provide high-resolution photographs and/or videos showing
                the item&apos;s overall condition, including relevant details such as the exterior,
                interior, hardware, serial or date markings, tags, and other applicable features.
              </>,
              <>
                <strong className="text-espresso">Client Confirmation:</strong> The client is
                responsible for carefully reviewing the photographs and/or videos provided and
                confirming acceptance of the item&apos;s documented condition before shipment.
              </>,
              <>
                <strong className="text-espresso">Condition Reference:</strong> The approved photographs
                and/or videos will serve as a reference for the item&apos;s condition at the time of
                shipment and may be used when evaluating any subsequent return request.
              </>,
            ]}
          />
          <p>
            Once the client has confirmed the item&apos;s condition and the item has been shipped, the
            client acknowledges that the item was accepted based on the documented condition presented
            prior to shipment.
          </p>
        </Section>

        <Section title="2. Return Eligibility">
          <p>Returns are subject to the conditions set forth in this Return Policy.</p>

          <SubHeading>7-Day Return Period</SubHeading>
          <p>
            Return requests must be submitted within{' '}
            <strong className="text-espresso">
              seven (7) calendar days from the date the client receives the item
            </strong>
            .
          </p>
          <p>
            The seven-day period does <strong className="text-espresso">not</strong> constitute a
            seven-day unconditional or &ldquo;no questions asked&rdquo; return policy. A return request
            must meet the applicable requirements stated in this Return Policy and is subject to
            inspection and approval by Holygrail Inc.
          </p>

          <SubHeading>Change of Mind</SubHeading>
          <p className="font-semibold text-espresso">
            Change of mind is not a valid reason for a return or refund.
          </p>
          <p>Holygrail Inc. does not accept returns or issue refunds solely because a client:</p>
          <List
            items={[
              'Changes their mind after completing the purchase;',
              'No longer wants the item;',
              'Finds another item they prefer;',
              'Orders the wrong item;',
              'Decides that the item is no longer suitable for them; or',
              "Experiences buyer's remorse.",
            ]}
          />
          <p>
            Clients are therefore encouraged to carefully review the item&apos;s photographs, videos,
            condition details, specifications, measurements, and other information provided by
            Holygrail Inc. and to confirm their acceptance before completing the purchase.
          </p>

          <SubHeading>Original Condition Required</SubHeading>
          <p>
            For a return request to be considered, the item must be returned in substantially the same
            condition in which it was received, together with all applicable original accessories and
            packaging, including, where applicable:
          </p>
          <List
            items={[
              'Dust bags;',
              'Authenticity cards;',
              'Tags;',
              'Protective films;',
              'Boxes and packaging;',
              'Straps and other accessories; and',
              'Other items included with the original purchase.',
            ]}
          />
          <p>
            Items that show signs of use, alteration, damage, or missing components may be subject to
            rejection of the return request.
          </p>
        </Section>

        <Section title="3. Inspection, Damage, and Condition Verification">
          <p>
            All returned items are subject to inspection by Holygrail Inc. before a return or refund is
            approved.
          </p>
          <p>
            If an item was documented and confirmed prior to shipment and is subsequently returned with
            evidence of:
          </p>
          <List
            items={[
              'Wear or use;',
              'Scratches or stains;',
              'Damage;',
              'Alteration or modification;',
              'Missing accessories or packaging;',
              'Structural changes;',
              'Replacement or substitution of components; or',
              "Any other condition inconsistent with the item's documented pre-shipment condition,",
            ]}
          />
          <p>Holygrail Inc. may decline the return or refund, subject to applicable laws and regulations.</p>
          <p>
            To protect the integrity of our merchandise, returned items may undergo detailed
            authentication, condition, and identity verification before a refund is processed.
          </p>
        </Section>

        <Section title="4. Shipping and Processing for Credit Card Payments">
          <p>For purchases made through our online credit card payment facility:</p>
          <p>
            Once payment has been successfully verified, Holygrail Inc. will securely prepare and ship
            the item <strong className="text-espresso">within seventy-two (72) hours</strong>, subject
            to final quality inspection, documentation, and applicable shipping arrangements.
          </p>
          <p>
            Certain circumstances, including weekends, holidays, courier limitations, payment
            verification delays, or circumstances beyond Holygrail Inc.&apos;s reasonable control, may
            affect the actual shipping timeline.
          </p>
        </Section>

        <Section title="5. Refund Process and Timelines">
          <p>If a return is approved following inspection:</p>
          <List
            items={[
              <>
                <strong className="text-espresso">Refund Processing:</strong> Approved refunds will
                generally be processed within{' '}
                <strong className="text-espresso">fifteen (15) to forty-five (45) calendar days</strong>
                , depending on the payment method and the processing requirements of the relevant
                financial institution or payment provider.
              </>,
              <>
                <strong className="text-espresso">Credit Card Transactions:</strong> Applicable payment
                gateway, bank, or transaction charges that are non-refundable may be deducted from the
                refundable amount, to the extent permitted by applicable law and the terms of the
                payment provider.
              </>,
              <>
                <strong className="text-espresso">Original Payment Method:</strong> Refunds will
                generally be issued through the original payment method used for the purchase.
              </>,
            ]}
          />
          <p>
            The actual date on which the refunded amount becomes available to the client may depend on
            the processing time of the client&apos;s bank or payment provider.
          </p>
        </Section>

        <Section title="6. Return Authorization and Shipping">
          <p>
            Before sending an item back, clients must first contact Holygrail Inc. and obtain return
            instructions and authorization.
          </p>
          <p>Unauthorized returns may not be accepted.</p>
          <p>
            Clients are responsible for ensuring that returned merchandise is securely packaged and
            adequately protected during transit. Where applicable, return shipping arrangements and
            costs will be communicated to the client before the return is authorized.
          </p>
          <p>
            Holygrail Inc. reserves the right to inspect all returned merchandise before determining
            whether a return and refund may be approved.
          </p>
        </Section>

        <Section title="7. Important Conditions">
          <p>
            The purchase of luxury merchandise is considered a transaction made based on the item&apos;s
            documented condition, specifications, and information provided to the client before
            purchase.
          </p>
          <p>
            Clients are encouraged to ask questions and request additional photographs, videos,
            measurements, or product information before completing their purchase.
          </p>
          <p className="font-semibold text-espresso">
            Once an item has been confirmed by the client and shipped, a change of mind or buyer&apos;s
            remorse shall not, by itself, constitute grounds for a return or refund.
          </p>
          <p>
            Nothing in this Return Policy is intended to exclude or limit any rights or remedies that
            cannot legally be excluded or limited under applicable Philippine laws and regulations.
          </p>
        </Section>

        <Section title="8. Contact Our Concierge">
          <p>
            For return requests, questions regarding an order, or assistance with a shipment, please
            contact us via our{' '}
            <a href="/contact" className="underline text-espresso hover:text-primary-700">
              Contact Us
            </a>{' '}
            page, or reach us at:
          </p>
          <div className="not-italic">
            <p className="font-semibold text-espresso">HOLYGRAIL INC.</p>
            <p>Unit 2Y, Lee Gardens Condominium</p>
            <p>Lee St. cor. Shaw Boulevard</p>
            <p>Brgy. Wack Wack, Mandaluyong City</p>
            <p>Philippines</p>
          </div>
          <p className="font-semibold text-espresso">
            Return requests must be submitted within seven (7) calendar days from receipt of the item
            and remain subject to the conditions and inspection requirements stated above.
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}
