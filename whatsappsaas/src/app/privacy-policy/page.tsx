// src/app/privacy-policy/page.tsx
// Privacy Policy page — required for Meta App Review + Embedded Signup

export const metadata = {
  title: "Privacy Policy — WA-Automations",
  description: "Privacy Policy for WA-Automations WhatsApp Marketing Platform",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 1, 2026";
  const companyName = "WA-Automations";
  const contactEmail = "sachinmeshram2408@gmail.com";
  const websiteUrl = "https://wautomation.shop";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-3">Privacy Policy</h1>
        <p className="text-teal-300 text-sm">Last updated: {lastUpdated}</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Intro */}
        <section>
          <p className="text-slate-300 leading-relaxed">
            Welcome to <strong className="text-white">{companyName}</strong> ("we", "our", or "us").
            We operate the website <a href={websiteUrl} className="text-teal-400 underline">{websiteUrl}</a> and
            provide WhatsApp marketing automation services for businesses ("Service").
          </p>
          <p className="mt-3 text-slate-300 leading-relaxed">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our Service. Please read this policy carefully.
          </p>
        </section>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            1. Information We Collect
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p><strong className="text-white">Business Information:</strong> When you register, we collect your business name, email address, phone number, and Shopify store URL.</p>
            <p><strong className="text-white">WhatsApp Business Data:</strong> We collect and store your WhatsApp Business Account (WABA) credentials, phone number ID, and access tokens provided by Meta to enable WhatsApp messaging services.</p>
            <p><strong className="text-white">Customer Data:</strong> Through Shopify integration, we sync customer phone numbers, names, email addresses, and order information to power abandoned cart recovery and marketing campaigns.</p>
            <p><strong className="text-white">Message Data:</strong> We store sent and received WhatsApp message content, delivery status, and engagement metrics (clicks, conversions) to provide analytics and campaign tracking.</p>
            <p><strong className="text-white">Usage Data:</strong> We automatically collect log data including IP addresses, browser type, pages visited, and timestamps when you use our platform.</p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300 leading-relaxed">
            <li>To provide, operate, and maintain our WhatsApp marketing automation Service</li>
            <li>To send WhatsApp messages on behalf of your business to your customers via Meta&apos;s WhatsApp Business API</li>
            <li>To process abandoned cart recovery, campaign broadcasts, and automated flow messages</li>
            <li>To track message delivery, read receipts, link clicks, and revenue recovery</li>
            <li>To provide analytics and reporting on campaign performance</li>
            <li>To improve and personalize your experience with our Service</li>
            <li>To communicate with you about your account, updates, and support</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        {/* Section 3 — Meta / WhatsApp */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            3. Meta and WhatsApp Business API
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              Our Service uses the <strong className="text-white">Meta WhatsApp Cloud API</strong> to send and receive
              WhatsApp messages. By using our Service, you agree to Meta&apos;s{" "}
              <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline">
                WhatsApp Business Policy
              </a>{" "}
              and{" "}
              <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline">
                Meta Privacy Policy
              </a>.
            </p>
            <p>
              We store your Meta access tokens and WABA credentials securely in our encrypted database.
              These credentials are used solely to send messages through the WhatsApp Business API on your behalf.
            </p>
            <p>
              Customer data (phone numbers, names) synced from your Shopify store is used only to send
              marketing and transactional messages that you configure and authorize through our platform.
            </p>
          </div>
        </section>

        {/* Section 4 — Shopify */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            4. Shopify Integration
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              Our Service integrates with Shopify to sync customer and order data. We access your Shopify store
              using a private app access token that you provide. We collect:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Customer names, phone numbers, and email addresses</li>
              <li>Abandoned checkout information</li>
              <li>Order details for delivery notifications and upsell flows</li>
            </ul>
            <p>
              This data is processed solely to enable WhatsApp automation features you configure.
              We do not sell or share this data with third parties.
            </p>
          </div>
        </section>

        {/* Section 5 — Data Sharing */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            5. Data Sharing and Disclosure
          </h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>We do <strong className="text-white">not</strong> sell, trade, or rent your personal information to third parties. We may share data with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Meta Platforms:</strong> To deliver WhatsApp messages via the Cloud API</li>
              <li><strong className="text-white">Supabase:</strong> Our database provider for secure data storage</li>
              <li><strong className="text-white">Upstash Redis:</strong> For message queue processing</li>
              <li><strong className="text-white">Render:</strong> Our cloud infrastructure provider</li>
              <li><strong className="text-white">Groq:</strong> For AI-powered auto-reply features (message content only, no personal data stored)</li>
            </ul>
            <p>All third-party providers are bound by their own privacy policies and data processing agreements.</p>
          </div>
        </section>

        {/* Section 6 — Data Retention */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            6. Data Retention
          </h2>
          <p className="text-slate-300 leading-relaxed">
            We retain your data for as long as your account is active or as needed to provide our Service.
            Message logs and customer data are retained for up to 12 months for analytics purposes.
            You may request deletion of your data at any time by contacting us at{" "}
            <a href={`mailto:${contactEmail}`} className="text-teal-400 underline">{contactEmail}</a>.
          </p>
        </section>

        {/* Section 7 — Security */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            7. Data Security
          </h2>
          <p className="text-slate-300 leading-relaxed">
            We implement industry-standard security measures including encrypted database storage, HTTPS
            for all data transmission, and restricted access controls. However, no method of transmission
            over the internet is 100% secure. We cannot guarantee absolute security but are committed to
            protecting your data using commercially reasonable measures.
          </p>
        </section>

        {/* Section 8 — Your Rights */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            8. Your Rights
          </h2>
          <div className="space-y-2 text-slate-300 leading-relaxed">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability — receive your data in a structured format</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{" "}
              <a href={`mailto:${contactEmail}`} className="text-teal-400 underline">{contactEmail}</a>.
            </p>
          </div>
        </section>

        {/* Section 9 — Opt-Out */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            9. Customer Opt-Out (WhatsApp Recipients)
          </h2>
          <p className="text-slate-300 leading-relaxed">
            End customers who receive WhatsApp messages through our platform can opt out at any time by
            replying <strong className="text-white">STOP</strong> to any message. Upon receiving an opt-out request,
            we immediately flag the customer in our system and cease sending future messages to that number.
          </p>
        </section>

        {/* Section 10 — Cookies */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            10. Cookies
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Our website uses minimal cookies necessary for authentication and session management.
            We do not use third-party tracking cookies or advertising cookies.
          </p>
        </section>

        {/* Section 11 — Children */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            11. Children&apos;s Privacy
          </h2>
          <p className="text-slate-300 leading-relaxed">
            Our Service is not directed to individuals under the age of 13. We do not knowingly collect
            personal information from children. If you become aware that a child has provided us with
            personal data, please contact us immediately.
          </p>
        </section>

        {/* Section 12 — Changes */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            12. Changes to This Policy
          </h2>
          <p className="text-slate-300 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by
            posting the new policy on this page with an updated &quot;Last updated&quot; date.
            Your continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* Section 13 — Contact */}
        <section>
          <h2 className="text-xl font-extrabold text-white mb-3 border-b border-white/10 pb-2">
            13. Contact Us
          </h2>
          <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 space-y-2">
            <p className="text-white font-bold">{companyName}</p>
            <p className="text-slate-300">
              Email:{" "}
              <a href={`mailto:${contactEmail}`} className="text-teal-400 underline">
                {contactEmail}
              </a>
            </p>
            <p className="text-slate-300">
              Website:{" "}
              <a href={websiteUrl} className="text-teal-400 underline">
                {websiteUrl}
              </a>
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-white/5 text-center py-8 text-slate-600 text-sm">
        © {new Date().getFullYear()} {companyName}. All rights reserved.{" "}
        <a href={websiteUrl} className="hover:text-teal-400 transition">wautomation.shop</a>
      </div>
    </div>
  );
}
