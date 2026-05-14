import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteName } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Learn about our shipping timelines, delivery charges, and tracking process.',
};

const sections = [
  {
    icon: '📦',
    title: 'Order Processing',
    content: [
      'All orders are processed within 1–2 business days after payment confirmation.',
      'Orders placed on weekends or public holidays will be processed on the next business day.',
      'You will receive an email confirmation with your order details once the order is placed successfully.',
    ],
  },
  {
    icon: '🚚',
    title: 'Shipping Timelines',
    content: [
      'Standard Delivery: 5–7 business days across India.',
      'Express Delivery: 2–3 business days (available at checkout for select pin codes).',
      'Metro cities (Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata): typically 3–4 business days.',
      'Remote areas and Tier-3 cities may require up to 10 business days.',
    ],
  },
  {
    icon: '💸',
    title: 'Shipping Charges',
    content: [
      'Free standard shipping on all orders above ₹500.',
      'A flat shipping fee of ₹50 applies to orders below ₹500.',
      'Express delivery charges (if applicable) will be shown at checkout.',
    ],
  },
  {
    icon: '📍',
    title: 'Order Tracking',
    content: [
      'Once your order is shipped, you will receive a tracking number via email and SMS.',
      'You can track your order from the "My Orders" section in your account.',
      'Tracking information may take up to 24 hours to update after dispatch.',
    ],
  },
  {
    icon: '⚠️',
    title: 'Delays & Exceptions',
    content: [
      'Delivery timelines may be affected by natural disasters, strikes, or other force majeure events.',
      'During sale seasons (festivals, special campaigns), dispatch may take an additional 1–2 business days.',
      'If your order is significantly delayed beyond the stated timeline, please contact our support team.',
    ],
  },
  {
    icon: '🔄',
    title: 'Failed Deliveries',
    content: [
      'If a delivery attempt fails due to an incorrect address or unavailability, our logistics partner will retry up to 2 times.',
      'After 2 failed attempts, the order will be returned to our warehouse and a refund will be initiated (excluding shipping charges).',
      'Please ensure your delivery address and contact number are correct at checkout.',
    ],
  },
];

export default function ShippingPolicyPage() {
  const siteName = getSiteName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            📋 Policy
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Shipping Policy</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Everything you need to know about how we deliver your orders across India.
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
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl p-8 text-center text-white">
          <p className="font-bold text-lg mb-1">Still have questions?</p>
          <p className="text-indigo-100 text-sm mb-5">Our support team is happy to help you with any shipping queries.</p>
          <Link
            href="/contact"
            className="inline-block bg-white text-indigo-600 font-bold px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm"
          >
            Contact Us →
          </Link>
        </div>

        {/* Back */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-2 pb-8">
          <Link href="/return-policy" className="hover:text-indigo-600 transition-colors">Return Policy</Link>
          <span>·</span>
          <Link href="/" className="hover:text-indigo-600 transition-colors">← Back to {siteName}</Link>
          <span>·</span>
          <Link href="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
