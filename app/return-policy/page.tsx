import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteName } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'Understand our 7-day return window, eligibility criteria, and refund process.',
};

const sections = [
  {
    icon: '📅',
    title: 'Return Window',
    content: [
      'We accept returns within 7 days of delivery for eligible products.',
      'The return request must be raised within 7 days from the date of delivery.',
      'Mystery boxes, gift cards, and sale items are non-returnable unless received damaged or defective.',
    ],
  },
  {
    icon: '✅',
    title: 'Eligibility Criteria',
    content: [
      'The product must be unused, unopened, and in its original packaging.',
      'All tags, seals, and accessories must be intact.',
      'Products that have been used, swatched, or tampered with are not eligible for return.',
      'A clear unboxing video or photos of the damaged/defective product must be provided for damage claims.',
    ],
  },
  {
    icon: '🚫',
    title: 'Non-Returnable Items',
    content: [
      'Opened or used skincare, makeup, and personal care products (for hygiene reasons).',
      'Mystery boxes (once revealed).',
      'Gift cards and digital vouchers.',
      'Items purchased during clearance or final-sale events.',
      'Products damaged due to misuse or improper storage by the customer.',
    ],
  },
  {
    icon: '🔄',
    title: 'How to Initiate a Return',
    content: [
      'Go to "My Orders" in your account and select the order you wish to return.',
      'Click "Request Return" and fill in the reason along with supporting photos/video.',
      'Our team will review your request within 2 business days.',
      'Once approved, a pickup will be scheduled or you may be asked to self-ship the product.',
    ],
  },
  {
    icon: '💳',
    title: 'Refund Process',
    content: [
      'Refunds are processed within 5–7 business days after we receive and inspect the returned product.',
      'Refunds will be credited to the original payment method (credit/debit card, UPI, net banking).',
      'If paid via wallet balance, the refund will be added back to your KosmeticX wallet.',
      'Shipping charges are non-refundable unless the return is due to our error (wrong or defective item).',
    ],
  },
  {
    icon: '🔧',
    title: 'Damaged or Wrong Items',
    content: [
      'If you received a damaged, defective, or wrong product, please contact us within 48 hours of delivery.',
      'Attach clear photos or an unboxing video to your support request.',
      'We will arrange a free pickup and send a replacement or full refund at no additional cost to you.',
    ],
  },
];

export default function ReturnPolicyPage() {
  const siteName = getSiteName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 text-pink-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            📋 Policy
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Return &amp; Refund Policy</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            We want you to love every product. Here&apos;s how we handle returns and refunds.
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
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-8 text-center text-white">
          <p className="font-bold text-lg mb-1">Need help with a return?</p>
          <p className="text-pink-100 text-sm mb-5">Reach out and our team will sort it out for you quickly.</p>
          <Link
            href="/contact"
            className="inline-block bg-white text-pink-600 font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm"
          >
            Contact Us →
          </Link>
        </div>

        {/* Back */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-2 pb-8">
          <Link href="/shipping-policy" className="hover:text-pink-600 transition-colors">Shipping Policy</Link>
          <span>·</span>
          <Link href="/" className="hover:text-pink-600 transition-colors">← Back to {siteName}</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-pink-600 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
