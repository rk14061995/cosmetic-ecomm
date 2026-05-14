import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteName, getSiteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions governing your use of KosmeticX.',
};

const sections = [
  {
    icon: '📌',
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using the KosmeticX website or mobile application, you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, please do not use our platform.',
      'We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of the revised terms.',
    ],
  },
  {
    icon: '🛒',
    title: 'Use of the Platform',
    content: [
      'You must be at least 18 years old (or have parental consent) to make purchases on KosmeticX.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'Any fraudulent, abusive, or unlawful use of the platform will result in immediate account termination.',
      'You agree not to scrape, crawl, or systematically access our website without explicit permission.',
    ],
  },
  {
    icon: '🛍️',
    title: 'Orders & Pricing',
    content: [
      'All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise.',
      'We reserve the right to cancel or refuse orders at our discretion, including in cases of pricing errors.',
      'Order confirmation does not guarantee product availability — in case of stock-out, a full refund will be issued.',
      'Promotional offers and discounts are subject to their own specific terms and cannot be combined unless stated.',
    ],
  },
  {
    icon: '💳',
    title: 'Payments',
    content: [
      'Payments are processed securely via Razorpay. We do not store any payment card or banking details.',
      'In case of a payment failure, the amount will be refunded to the original source within 5–7 business days.',
      'Any disputes regarding payments must be raised within 30 days of the transaction date.',
    ],
  },
  {
    icon: '🚚',
    title: 'Shipping & Delivery',
    content: [
      'Delivery timelines are estimates and may vary due to factors beyond our control.',
      'Risk of loss and title for products pass to you upon delivery to the carrier.',
      'Please refer to our Shipping Policy for detailed information on timelines and charges.',
    ],
  },
  {
    icon: '↩️',
    title: 'Returns & Refunds',
    content: [
      'Returns are subject to our Return Policy, which forms part of these Terms of Service.',
      'Refunds will be processed to the original payment method within 5–7 business days of approval.',
      'We reserve the right to reject returns that do not meet eligibility criteria.',
    ],
  },
  {
    icon: '©️',
    title: 'Intellectual Property',
    content: [
      'All content on KosmeticX — including logos, images, product descriptions, and text — is owned by or licensed to us.',
      'You may not copy, reproduce, or distribute any content without our written permission.',
      'User-submitted reviews and content grant us a non-exclusive, royalty-free licence to use and display them.',
    ],
  },
  {
    icon: '⚖️',
    title: 'Limitation of Liability',
    content: [
      'KosmeticX is not liable for any indirect, incidental, or consequential damages arising from use of our platform.',
      'Our total liability for any claim shall not exceed the amount paid by you for the relevant order.',
      'We make no warranty that our platform will be error-free or uninterrupted at all times.',
    ],
  },
  {
    icon: '🏛️',
    title: 'Governing Law',
    content: [
      'These terms are governed by the laws of India.',
      'Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.',
      'For informal resolution, please contact our support team before initiating legal proceedings.',
    ],
  },
];

export default function TermsPage() {
  const siteName = getSiteName();
  const siteUrl = getSiteUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            ⚖️ Legal
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Please read these terms carefully before using {siteName}.
          </p>
          <p className="text-xs text-gray-400 mt-4">Last updated: May 2025 · Effective immediately</p>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">📢</span>
          <p className="text-sm text-amber-800 leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your use of <strong>{siteName}</strong> ({siteUrl}), operated by KosmeticX. By using our platform, you agree to these terms in full.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
              <span className="text-2xl">{sec.icon}</span>
              <h2 className="text-lg font-bold text-gray-900">{sec.title}</h2>
            </div>
            <ul className="px-8 py-6 space-y-3">
              {sec.content.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 text-center text-white">
          <p className="font-bold text-lg mb-1">Have legal questions?</p>
          <p className="text-gray-400 text-sm mb-5">Reach out to us and we&apos;ll respond within 3 business days.</p>
          <Link
            href="/contact"
            className="inline-block bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm"
          >
            Contact Us →
          </Link>
        </div>

        {/* Back */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-2 pb-8">
          <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-700 transition-colors">← Back to {siteName}</Link>
          <span>·</span>
          <Link href="/return-policy" className="hover:text-gray-700 transition-colors">Return Policy</Link>
        </div>
      </div>
    </div>
  );
}
