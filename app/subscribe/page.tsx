'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import type { ApiError } from '@/types/api';

type Tier = 'basic' | 'standard' | 'premium';

type Subscription = {
  tier?: string;
  status?: string;
  nextBillingDate?: string;
  startDate?: string;
};

const TIERS: {
  id: Tier;
  name: string;
  price: number;
  value: string;
  products: string;
  popular?: boolean;
  exclusive?: boolean;
  gradient: string;
  accentFrom: string;
  accentTo: string;
  inclusions: string[];
}[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 449,
    value: '₹800+',
    products: '3–4 products',
    gradient: 'from-pink-50 to-rose-50',
    accentFrom: 'from-pink-400',
    accentTo: 'to-rose-400',
    inclusions: [
      '3–4 hand-picked beauty products',
      'Skincare essentials',
      'Sample-size luxuries',
      'Monthly theme card',
      'Free standard shipping',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 899,
    value: '₹1500+',
    products: '4–5 products',
    popular: true,
    gradient: 'from-purple-50 to-pink-50',
    accentFrom: 'from-purple-500',
    accentTo: 'to-pink-500',
    inclusions: [
      '4–5 full-size beauty products',
      'Premium skincare + makeup',
      'Exclusive kosmeticX samples',
      'Beauty tips booklet',
      'Free express shipping',
      'Members-only discounts',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1799,
    value: '₹3000+',
    products: '5–7 products',
    exclusive: true,
    gradient: 'from-yellow-50 to-orange-50',
    accentFrom: 'from-yellow-400',
    accentTo: 'to-orange-400',
    inclusions: [
      '5–7 full-size luxury products',
      'High-end skincare & perfumes',
      'Exclusive & limited-edition items',
      'Personalised beauty profile match',
      'Free priority shipping',
      'VIP early access & events',
      'Personal beauty consultant',
    ],
  },
];

const FAQS = [
  {
    q: 'When will my box be delivered?',
    a: 'Boxes ship in the first week of each month. You\'ll receive a tracking email once your box is dispatched.',
  },
  {
    q: 'Can I skip a month?',
    a: 'Yes! You can pause your subscription anytime from your dashboard. Just pause before the 25th of the month to skip the next billing cycle.',
  },
  {
    q: 'What if I don\'t like a product?',
    a: 'We hand-pick products based on popular beauty trends and your profile. If a product is damaged or defective, we\'ll replace it free of charge.',
  },
  {
    q: 'How do I cancel?',
    a: 'You can cancel anytime from your dashboard with no cancellation fees. Your subscription continues until the end of the billing period.',
  },
];

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
  past_due: 'bg-orange-100 text-orange-700',
};

export default function SubscribePage() {
  const router = useRouter();
  const { user, authReady } = useAuthStatus();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading]     = useState(true);
  const [subError, setSubError]         = useState('');

  const [subscribing, setSubscribing]   = useState<Tier | null>(null);
  const [pausing, setPausing]           = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user) { setSubLoading(false); return; }
    api.get('/subscriptions/my')
      .then(({ data }) => setSubscription(data.subscription || null))
      .catch((err) => {
        if (err?.response?.status !== 404) setSubError('Failed to load subscription info.');
      })
      .finally(() => setSubLoading(false));
  }, [user, authReady]);

  const handleSubscribe = async (tier: Tier) => {
    if (!authReady) return;
    if (!user) { router.push('/auth/login'); return; }
    setSubscribing(tier);
    try {
      const { data } = await api.post('/subscriptions', {
        tier,
        shippingAddress: user.addresses?.[0],
      });
      setSubscription(data.subscription);
      toast.success(`Subscribed to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan!`);
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const handlePause = async () => {
    setPausing(true);
    try {
      const { data } = await api.put('/subscriptions/pause');
      setSubscription(data.subscription);
      toast.success('Subscription paused successfully.');
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to pause subscription.');
    } finally {
      setPausing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.delete('/subscriptions/cancel');
      setSubscription(null);
      setConfirmCancel(false);
      toast.success('Subscription cancelled.');
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-900 to-rose-800 text-white py-20 px-4 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Monthly Beauty Box</h1>
        <p className="text-pink-200 text-xl">Fresh discoveries, delivered every month</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {subLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subError ? (
          <div className="text-center py-12 text-red-500">{subError}</div>
        ) : subscription ? (
          /* ─── Active Subscription Management ─── */
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Subscription</h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              {/* Current plan */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Plan</p>
                  <p className="text-3xl font-bold text-gray-900 capitalize">{subscription.tier}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {formatPrice(TIERS.find((t) => t.id === subscription.tier)?.price ?? 0)}/month
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${STATUS_COLORS[subscription.status ?? ''] || 'bg-gray-100 text-gray-600'}`}>
                  {subscription.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {subscription.nextBillingDate && (
                  <div className="bg-pink-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Next Billing Date</p>
                    <p className="font-bold text-gray-900">{formatDate(subscription.nextBillingDate)}</p>
                  </div>
                )}
                {subscription.startDate && (
                  <div className="bg-rose-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="font-bold text-gray-900">{formatDate(subscription.startDate)}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {subscription.status === 'active' && (
                  <button
                    onClick={handlePause}
                    disabled={pausing}
                    className="w-full py-3 rounded-full border-2 border-yellow-400 text-yellow-600 font-semibold hover:bg-yellow-50 transition-all disabled:opacity-60"
                  >
                    {pausing ? 'Pausing...' : 'Pause Subscription'}
                  </button>
                )}
                {subscription.status === 'paused' && (
                  <button
                    onClick={handlePause}
                    disabled={pausing}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:shadow-md hover:scale-105 transition-all disabled:opacity-60"
                  >
                    {pausing ? 'Resuming...' : 'Resume Subscription'}
                  </button>
                )}

                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-3 rounded-full border-2 border-red-200 text-red-400 font-semibold hover:bg-red-50 hover:border-red-400 transition-all text-sm"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                    <p className="font-semibold text-gray-800 mb-1">Are you sure?</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Your subscription will end at the current billing period.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 text-sm transition-all"
                      >
                        Keep It
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60 text-sm transition-all"
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Tier Selection ─── */
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-500">Cancel or pause anytime. No long-term commitments.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative bg-gradient-to-br ${tier.gradient} rounded-3xl border border-white shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
                >
                  {/* Popular / Exclusive badges */}
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  {tier.exclusive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      EXCLUSIVE
                    </div>
                  )}

                  {/* Top accent bar */}
                  <div className={`h-2 bg-gradient-to-r ${tier.accentFrom} ${tier.accentTo} rounded-t-3xl`} />

                  <div className="p-7 pt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{tier.products} · Worth {tier.value}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-gray-900">{formatPrice(tier.price)}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>

                    <ul className="space-y-2 mb-7">
                      {tier.inclusions.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-pink-500 font-bold">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={subscribing !== null}
                      className={`w-full py-3 rounded-full font-bold text-white bg-gradient-to-r ${tier.accentFrom} ${tier.accentTo} hover:shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      {subscribing === tier.id ? 'Subscribing...' : 'Subscribe Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
              {[
                { icon: '🔒', label: 'Secure Payment' },
                { icon: '↩️', label: 'Easy Cancellation' },
                { icon: '📦', label: 'Free Shipping' },
              ].map((badge) => (
                <div key={badge.label} className="text-center bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="text-xs font-semibold text-gray-600">{badge.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
