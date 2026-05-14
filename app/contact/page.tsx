'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CONTACT_METHODS = [
  {
    icon: '📧',
    label: 'Email',
    value: 'support@kosmeticx.in',
    sub: 'We reply within 24 hours',
    href: 'mailto:support@kosmeticx.in',
    accent: 'from-indigo-500 to-cyan-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    text: 'text-indigo-600',
  },
  {
    icon: '💬',
    label: 'WhatsApp',
    value: '+91 98765 43210',
    sub: 'Mon – Sat, 10 AM – 7 PM',
    href: 'https://wa.me/919876543210',
    accent: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50',
    border: 'border-green-100',
    text: 'text-green-600',
  },
  {
    icon: '📍',
    label: 'Address',
    value: 'KosmeticX, Hyderabad, Telangana, India',
    sub: 'Registered office',
    href: null,
    accent: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    text: 'text-pink-600',
  },
];

const FAQS = [
  { q: 'Where is my order?', a: 'Track your order from "My Orders" in your account. You'll also get an SMS/email with a tracking link once shipped.' },
  { q: 'How do I return a product?', a: 'Go to "My Orders", select the item, and click "Request Return". Our team reviews it within 2 business days.' },
  { q: 'My payment failed but money was deducted.', a: 'Failed payments are auto-refunded within 5–7 business days. Email us with your order ID for faster resolution.' },
  { q: 'Can I change my delivery address after ordering?', a: 'Address changes are possible only within 2 hours of placing the order. Contact us immediately via WhatsApp.' },
  { q: 'Do you ship outside India?', a: 'We currently ship only within India. International shipping is coming soon!' },
];

type FormState = { name: string; email: string; subject: string; message: string };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setSending(true);
    // Simulate sending — replace with real API call if backend endpoint exists
    await new Promise((r) => setTimeout(r, 1200));
    toast.success('Message sent! We'll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            💌 Get in Touch
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Questions, feedback, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Left — contact cards + FAQ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact methods */}
            {CONTACT_METHODS.map((m) => (
              <div key={m.label} className={`rounded-2xl border ${m.border} ${m.bg} p-5 flex items-start gap-4`}>
                <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.accent} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                  {m.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{m.label}</p>
                  {m.href ? (
                    <a href={m.href} target={m.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                      className={`font-bold ${m.text} hover:underline text-sm`}>
                      {m.value}
                    </a>
                  ) : (
                    <p className="font-bold text-gray-800 text-sm">{m.value}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                </div>
              </div>
            ))}

            {/* FAQs */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Common Questions</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {FAQS.map((faq) => (
                  <details key={faq.q} className="group px-6 py-4 cursor-pointer">
                    <summary className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-800 list-none select-none">
                      {faq.q}
                      <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 text-lg leading-none">›</span>
                    </summary>
                    <p className="mt-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Right — contact form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
              <div className="px-8 py-6 border-b border-gray-50">
                <h2 className="font-bold text-gray-900 text-lg">Send us a message</h2>
                <p className="text-sm text-gray-400 mt-1">We typically reply within 24 hours on business days.</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select a topic</option>
                    <option>Order issue</option>
                    <option>Return / Refund</option>
                    <option>Payment problem</option>
                    <option>Product question</option>
                    <option>Partnership / Collab</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Describe your issue or question in detail…"
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-3.5 rounded-2xl hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    '📨 Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Policy links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 pt-10 pb-4">
          {[
            { href: '/shipping-policy', label: 'Shipping Policy' },
            { href: '/return-policy', label: 'Return Policy' },
            { href: '/privacy-policy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-indigo-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
