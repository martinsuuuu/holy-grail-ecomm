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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-espresso/50 mb-3">Policies</p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-espresso mb-3 leading-tight">
          Privacy Policy
        </h1>
        <p className="text-sm font-semibold text-espresso mb-8">Effective Date: September 2026</p>

        <div className="space-y-4 text-espresso/70 leading-relaxed text-sm mb-2">
          <p>
            At <strong className="text-espresso">Holygrail Inc.</strong>, we value your privacy as much
            as we value the rare and exceptional pieces we curate. We are committed to protecting your
            personal information and handling it responsibly, transparently, and securely in accordance
            with the{' '}
            <strong className="text-espresso">
              Data Privacy Act of 2012 (Republic Act No. 10173)
            </strong>{' '}
            and its implementing rules and regulations.
          </p>
          <p>
            This Privacy Policy explains how Holygrail Inc. collects, uses, stores, protects, and
            otherwise processes personal information when you interact with us through our website,
            online channels, or other communication platforms.
          </p>
          <p>
            By providing your personal information to Holygrail Inc., you acknowledge that you have
            read and understood this Privacy Policy and that your personal information may be processed
            for the purposes described herein, subject to applicable laws and regulations.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p>
            When you interact with Holygrail Inc., including through our website&apos;s{' '}
            <a href="/contact" className="underline text-espresso hover:text-primary-700">
              Contact Us
            </a>{' '}
            form, we may collect personal information that you voluntarily provide, including:
          </p>
          <List items={['Full Name;', 'Email Address;', 'Contact Number; and', 'Other information that you voluntarily provide in your inquiry or communication with us.']} />
          <p>We collect only information that is reasonably necessary for the purpose for which it is obtained.</p>
          <p>
            Depending on the nature of your transaction or inquiry, additional information may be
            collected when necessary to process an order, arrange payment, facilitate delivery, provide
            customer support, or comply with legal and regulatory requirements.
          </p>
        </Section>

        <Section title="2. Purpose of Processing">
          <p>Holygrail Inc. processes personal information for legitimate and specified purposes, including:</p>
          <List
            items={[
              'Responding to inquiries regarding our luxury handbags, apparel, watches, jewelry, accessories, and other merchandise;',
              'Providing personalized consultations and product information;',
              'Responding to requests for specific or hard-to-find items;',
              'Communicating with clients regarding inquiries, orders, appointments, and services;',
              'Processing and facilitating transactions when applicable;',
              'Coordinating deliveries, shipments, and other services necessary to fulfill a transaction;',
              'Maintaining appropriate business and transaction records;',
              'Improving our customer service and client experience;',
              'Protecting the security and integrity of our business, systems, and merchandise; and',
              'Complying with applicable legal, regulatory, accounting, and reporting requirements.',
            ]}
          />
          <p>Holygrail Inc. does not collect personal information that is excessive or unrelated to the purpose for which it is processed.</p>
        </Section>

        <Section title="3. Legal Basis for Processing">
          <p>Depending on the circumstances, Holygrail Inc. may process personal information on one or more lawful bases recognized under applicable Philippine data privacy laws, including:</p>
          <List
            items={[
              <><strong className="text-espresso">Consent</strong> — where you have voluntarily provided consent to the processing of your personal information;</>,
              <><strong className="text-espresso">Contractual necessity</strong> — where processing is necessary to provide a product or service, process a transaction, or take steps at your request before entering into a transaction;</>,
              <><strong className="text-espresso">Legal obligation</strong> — where processing is necessary to comply with a legal or regulatory requirement; and</>,
              <><strong className="text-espresso">Legitimate interests</strong> — where processing is necessary for legitimate business purposes and does not override your fundamental rights and freedoms.</>,
            ]}
          />
        </Section>

        <Section title="4. Data Sharing and Third Parties">
          <p className="font-semibold text-espresso">Holygrail Inc. does not sell, rent, or trade your personal information for commercial purposes.</p>
          <p>However, where necessary and permitted by law, your personal information may be disclosed to or processed by authorized third parties or service providers who assist us in operating our business, including, where applicable:</p>
          <List
            items={[
              'Payment processors and financial institutions;',
              'Courier and delivery service providers;',
              'Information technology and cloud service providers;',
              'Website and system service providers;',
              'Professional advisers and service providers;',
              'Government agencies and regulatory authorities when legally required; and',
              'Other parties where disclosure is necessary to fulfill a transaction, protect our rights, or comply with applicable laws.',
            ]}
          />
          <p>Where third-party service providers process personal information on behalf of Holygrail Inc., we take reasonable measures to ensure that appropriate privacy and security safeguards are in place.</p>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>Holygrail Inc. is committed to protecting personal information against unauthorized access, alteration, disclosure, loss, misuse, or destruction.</p>
          <p>We implement appropriate <strong className="text-espresso">organizational, physical, and technical security measures</strong> based on the nature, scope, and risks associated with the personal information we process.</p>
          <p>Access to personal information is limited to authorized personnel and service providers who require access for legitimate business purposes. Personnel who have access to personal information are expected to observe confidentiality and applicable privacy and security policies.</p>
          <p>While we take reasonable measures to protect personal information, no electronic transmission or storage system can be guaranteed to be completely secure.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>Holygrail Inc. retains personal information only for as long as reasonably necessary to fulfill the declared and legitimate purposes for which it was collected, to comply with legal and regulatory obligations, to maintain appropriate business records, or to establish, exercise, or defend legal claims.</p>
          <p>The applicable retention period may vary depending on the type of information, the purpose of processing, and applicable legal or regulatory requirements.</p>
          <p>When personal information is no longer required, Holygrail Inc. will take reasonable measures to securely dispose of, delete, anonymize, or otherwise prevent unauthorized further access or processing of the information.</p>
        </Section>

        <Section title="7. Your Rights as a Data Subject">
          <p>Under the Data Privacy Act of 2012, you may have the following rights, subject to applicable conditions and limitations:</p>

          <SubHeading>Right to Be Informed</SubHeading>
          <p>You have the right to know whether your personal information is being processed and to receive information regarding the nature, purpose, and extent of such processing.</p>

          <SubHeading>Right to Access</SubHeading>
          <p>You may request reasonable access to personal information concerning you that we process, subject to applicable law.</p>

          <SubHeading>Right to Correction or Rectification</SubHeading>
          <p>You may request correction of inaccurate or incomplete personal information.</p>

          <SubHeading>Right to Object</SubHeading>
          <p>You may object to certain processing of your personal information, subject to applicable legal grounds and limitations.</p>

          <SubHeading>Right to Erasure or Blocking</SubHeading>
          <p>You may request the erasure, blocking, or removal of your personal information when the conditions provided under applicable law are met.</p>

          <SubHeading>Right to Data Portability</SubHeading>
          <p>Where applicable, you may request a copy of your personal information in a structured and commonly used electronic format.</p>

          <SubHeading>Right to File a Complaint</SubHeading>
          <p>You have the right to lodge a complaint with the <strong className="text-espresso">National Privacy Commission (NPC)</strong> if you believe that your data privacy rights have been violated.</p>

          <SubHeading>Right to Damages</SubHeading>
          <p>Where provided by law, you may seek compensation for damages resulting from unlawful or unauthorized processing of your personal information.</p>
        </Section>

        <Section title="8. Withdrawal of Consent">
          <p>Where processing is based on your consent, you may withdraw your consent at any time, subject to applicable legal or contractual limitations.</p>
          <p>Withdrawal of consent will not affect the lawfulness of processing that occurred before the withdrawal.</p>
          <p>Please note that certain information may need to be retained where continued processing is necessary to comply with a legal obligation, fulfill a contractual obligation, establish or defend legal claims, or satisfy another lawful basis recognized under applicable law.</p>
        </Section>

        <Section title="9. Direct Marketing and Communications">
          <p>Holygrail Inc. may communicate with you regarding inquiries, transactions, services, and other matters relevant to your relationship with us.</p>
          <p>Where applicable, promotional or marketing communications will be sent in accordance with applicable data privacy requirements. You may request to opt out of marketing communications at any time.</p>
        </Section>

        <Section title="10. Cookies and Website Technologies">
          <p>Our website may use cookies or similar technologies to support website functionality, security, analytics, and the overall user experience.</p>
          <p>Where applicable, information collected through these technologies may include technical or usage information such as browser type, device information, pages visited, and website interaction data.</p>
          <p>You may be able to manage or disable certain cookies through your browser settings. Some website functions may be affected if cookies are disabled.</p>
        </Section>

        <Section title="11. Children's Privacy">
          <p>Our website and services are not intended to knowingly collect personal information from children without the appropriate consent or authorization required under applicable law.</p>
          <p>If we become aware that personal information relating to a child has been collected in circumstances where appropriate authorization was required but was not obtained, we will take reasonable steps to address the situation in accordance with applicable law.</p>
        </Section>

        <Section title="12. Changes to This Privacy Policy">
          <p>Holygrail Inc. may update or revise this Privacy Policy from time to time to reflect changes in our business practices, technology, applicable laws, or regulatory requirements.</p>
          <p>Any material changes will be communicated through appropriate means, including by posting an updated version of this Privacy Policy on our website.</p>
          <p>The <strong className="text-espresso">Effective Date</strong> indicated at the beginning of this Privacy Policy reflects the date of the latest update.</p>
        </Section>

        <Section title="13. Data Protection Officer / Privacy Contact">
          <p>For questions, concerns, requests, or complaints regarding the processing of your personal information, or to exercise your rights as a data subject, you may contact Holygrail Inc. through the contact details below.</p>
          <div className="not-italic">
            <p className="font-semibold text-espresso">HOLYGRAIL INC.</p>
            <p>Unit 2Y, Lee Gardens Condominium</p>
            <p>Lee St. cor. Shaw Boulevard</p>
            <p>Brgy. Wack Wack, Mandaluyong City</p>
            <p>Philippines</p>
          </div>
          <p>
            You may also reach our Data Protection Officer / Privacy contact through our{' '}
            <a href="/contact" className="underline text-espresso hover:text-primary-700">
              Contact Us
            </a>{' '}
            page.
          </p>
          <p>For privacy-related requests, please provide sufficient information to allow us to verify your identity and properly process your request.</p>
        </Section>

        <Section title="14. Complaints">
          <p>If you have concerns regarding how Holygrail Inc. processes your personal information, we encourage you to contact us first so that we may investigate and address your concern.</p>
          <p>You may also lodge a complaint with the <strong className="text-espresso">National Privacy Commission</strong> in accordance with applicable Philippine data privacy laws and regulations.</p>
        </Section>

        <div className="pt-10 mt-10 border-t border-stone-200">
          <h3 className="font-display font-bold text-base text-espresso mb-3">Holygrail Inc. Commitment</h3>
          <div className="space-y-4 text-espresso/70 leading-relaxed text-sm">
            <p>
              At Holygrail Inc., we believe that a refined client experience extends beyond the products
              we offer. It also means treating every client&apos;s personal information with{' '}
              <strong className="text-espresso">respect, confidentiality, transparency, and care</strong>.
            </p>
            <p>
              We are committed to maintaining responsible data privacy practices and continuously
              improving the safeguards we use to protect the information entrusted to us.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
