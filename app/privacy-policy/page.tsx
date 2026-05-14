import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteName } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How KosmeticX collects, uses, and protects your personal information.',
};

const sections = [
  {
    icon: '📥',
    title: 'Information We Collect',
    content: [
      'Personal details: name, email address, phone number, and delivery address when you register or place an order.',
      'Payment information: we do not store card or UPI details — all payments are processed securely by Razorpay.',
      'Usage data: pages visited, products viewed, and actions taken on the site to improve your experience.',
      'Device information: browser type, IP address, and operating system for security and analytics purposes.',
    ],
  },
  {
    icon: '🎯',
    title: 'How We Use Your Information',
    content: [
      'To process and fulfill your orders, including sending order confirmations and shipping updates.',
      'To personalise your shopping experience and recommend products relevant to you.',
      'To send promotional emails and offers — you can unsubscribe at any time.',
      'To detect and prevent fraud, abuse, and security incidents.',
      'To comply with legal obligations and respond to lawful requests from authorities.',
    ],
  },
  {
    icon: '🤝',
    title: 'Sharing Your Information',
    content: [
      'We do not sell your personal data to third parties.',
      'We share your address and contact number with our logistics partners solely to deliver your orders.',
      'Payment data is shared with Razorpay as our payment gateway — governed by their own privacy policy.',
      'We may share anonymised, aggregated data with analytics providers to improve our services.',
    ],
  },
  {
    icon: '🍪',
    title: 'Cookies',
    content: [
      'We use cookies to keep you logged in, remember your cart, and analyse site traffic.',
      'You can disable cookies in your browser settings, but some features may not work correctly.',
      'We use Google Analytics (or similar) for anonymous usage statistics — no personally identifiable data is shared.',
    ],
  },
  {
    icon: '🔐',
    title: 'Data Security',
    content: [
      'All data is transmitted over HTTPS (SSL/TLS encryption).',
      'Passwords are hashed using industry-standard algorithms and are never stored in plain text.',
      'We regularly review our security practices and update them to protect your data.',
      'In the event of a data breach, we will notify affected users within 72 hours as required by applicable law.',
    ],
  },
  {
    icon: '👤',
    title: 'Your Rights',
    content: [
      'Access: you can view and update your personal details from your account profile.',
      'Deletion: you may request deletion of your account and associated data by contacting us.',
      'Opt-out: you can unsubscribe from marketing emails via the link in any email we send.',
      'Data portability: you may request a copy of your personal data in a machine-readable format.',
    ],
  },
  {
    icon: '🔗',
    title: 'Third-Party Links',
    content: [
      'Our website may contain links to third-party sites. We are not responsible for their privacy practices.',
      'We encourage you to read the privacy policies of any external sites you visit.',
    ],
  },
  {
    icon: '📝',
    title: 'Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time. The "Last updated" date will reflect any changes.',
      'Continued use of our website after changes constitutes acceptance of the updated policy.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  const siteName = getSiteName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            🔒 Privacy
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Your privacy matters to us. Here&apos;s exactly how we handle your data.
          </p>
          <p className="text-xs text-gray-400 mt-4">Last updated: May 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
              <span className="text-2xl">{sec.icon}</span>
              <h2 className="text-lg font-bold text-gray-900">{sec.title}</h2>
            </div>
            <ul className="px-8 py-6 space-y-3">
              {sec.content.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-3xl p-8 text-center text-white">
          <p className="font-bold text-lg mb-1">Questions about your data?</p>
          <p className="text-violet-100 text-sm mb-5">Contact our privacy team and we&apos;ll respond within 2 business days.</p>
          <Link
            href="/contact"
            className="inline-block bg-white text-violet-600 font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm"
          >
            Contact Us →
          </Link>
        </div>

        {/* Back */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-2 pb-8">
          <Link href="/terms" className="hover:text-violet-600 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/" className="hover:text-violet-600 transition-colors">← Back to {siteName}</Link>
          <span>·</span>
          <Link href="/shipping-policy" className="hover:text-violet-600 transition-colors">Shipping Policy</Link>
        </div>
      </div>
    </div>
  );
}
