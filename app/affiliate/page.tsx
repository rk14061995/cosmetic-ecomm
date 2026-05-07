'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAYOUT_METHODS = ['wallet', 'upi', 'bank'] as const;
type PayoutMethod = typeof PAYOUT_METHODS[number];

const PAYOUT_PLACEHOLDERS: Record<PayoutMethod, string> = {
  wallet: 'Your GlowBox wallet will be credited automatically',
  upi:    'Enter your UPI ID (e.g. name@upi)',
  bank:   'Enter IFSC code and account number separated by a comma',
};

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 border border-yellow-300',
  approved: 'bg-green-100 text-green-700 border border-green-300',
  rejected: 'bg-red-100 text-red-600 border border-red-300',
};

export default function AffiliatePage() {
  const { user } = useSelector((state: any) => state.auth);

  const [affiliate, setAffiliate]         = useState<any>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [affiliateError, setAffiliateError]     = useState('');

  // Application form
  const [bio, setBio]                   = useState('');
  const [instagram, setInstagram]       = useState('');
  const [youtube, setYoutube]           = useState('');
  const [website, setWebsite]           = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('upi');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const [copied, setCopied] = useState(false);

  const fetchAffiliate = useCallback(() => {
    if (!user) { setAffiliateLoading(false); return; }
    api.get('/affiliates/me')
      .then(({ data }) => setAffiliate(data.affiliate || null))
      .catch((err) => {
        // 404 means not yet an affiliate — not an error to display
        if (err?.response?.status !== 404) {
          setAffiliateError('Failed to load affiliate data.');
        }
      })
      .finally(() => setAffiliateLoading(false));
  }, [user]);

  useEffect(() => { fetchAffiliate(); }, [fetchAffiliate]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim()) { toast.error('Please write a short bio.'); return; }
    setSubmitting(true);
    try {
      await api.post('/affiliates/apply', {
        bio: bio.trim(),
        instagram: instagram.trim(),
        youtube: youtube.trim(),
        website: website.trim(),
        payoutMethod,
        payoutDetails: payoutDetails.trim(),
      });
      setSubmitted(true);
      toast.success('Application submitted!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const affiliateLink =
    typeof window !== 'undefined' && affiliate?.code
      ? `${window.location.origin}/products?ref=${affiliate.code}`
      : '';

  const copyLink = () => {
    if (!affiliateLink) return;
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white py-20 px-4 text-center">
        <div className="text-5xl mb-4">💄</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Become a GlowBox Affiliate</h1>
        <p className="text-purple-200 text-xl mb-10">Earn 10% commission on every sale you refer</p>

        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            { value: '10%', label: 'Commission Rate' },
            { value: '30-day', label: 'Cookie Window' },
            { value: 'Monthly', label: 'Payouts' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur rounded-2xl p-5">
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-purple-300 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Loading */}
        {affiliateLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : affiliateError ? (
          <div className="text-center py-20 text-red-500">{affiliateError}</div>
        ) : affiliate ? (
          /* ─── Existing Affiliate Dashboard ─── */
          <div className="space-y-8">
            {/* Status + Link */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Affiliate Dashboard</h2>
                  <p className="text-gray-500 text-sm mt-1">Track your earnings and referrals</p>
                </div>
                <span className={`text-sm font-bold px-4 py-2 rounded-full ${STATUS_STYLES[affiliate.status] || 'bg-gray-100 text-gray-600'}`}>
                  {affiliate.status?.charAt(0).toUpperCase() + affiliate.status?.slice(1)}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Clicks',   value: affiliate.totalClicks   ?? 0,                       icon: '👆' },
                  { label: 'Total Orders',   value: affiliate.totalOrders   ?? 0,                       icon: '📦' },
                  { label: 'Total Earnings', value: formatPrice(affiliate.totalEarnings ?? 0),           icon: '💰' },
                  { label: 'Pending Payout', value: formatPrice(affiliate.pendingPayout ?? 0),           icon: '⏳' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 text-center">
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Affiliate link */}
              {affiliate.status === 'approved' && affiliateLink && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Your Affiliate Link</p>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 font-mono truncate">
                      {affiliateLink}
                    </div>
                    <button
                      onClick={copyLink}
                      className={`flex-shrink-0 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-md hover:scale-105'
                      }`}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Commission history */}
            {affiliate.referrals?.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-5">Commission History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left pb-3 text-gray-500 font-semibold">Order</th>
                        <th className="text-left pb-3 text-gray-500 font-semibold">Date</th>
                        <th className="text-right pb-3 text-gray-500 font-semibold">Order Value</th>
                        <th className="text-right pb-3 text-gray-500 font-semibold">Commission</th>
                        <th className="text-right pb-3 text-gray-500 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {affiliate.referrals.slice(0, 10).map((ref: any, i: number) => (
                        <tr key={ref._id || i} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-mono text-gray-700">
                            #{ref.orderId?.slice(-8)?.toUpperCase() || '—'}
                          </td>
                          <td className="py-3 text-gray-500">{ref.date ? formatDate(ref.date) : '—'}</td>
                          <td className="py-3 text-right text-gray-700">{formatPrice(ref.orderAmount ?? 0)}</td>
                          <td className="py-3 text-right font-semibold text-pink-600">{formatPrice(ref.commission ?? 0)}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              ref.status === 'paid' ? 'bg-green-100 text-green-700' :
                              ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {ref.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : submitted ? (
          /* ─── Submission success ─── */
          <div className="max-w-xl mx-auto text-center bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
            <div className="text-6xl mb-5">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
            <p className="text-gray-500">
              We'll review your application and get back to you within{' '}
              <span className="font-semibold text-gray-700">48 hours</span>. Keep an eye on your inbox!
            </p>
          </div>
        ) : (
          /* ─── Application Form ─── */
          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply to Join</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Tell us about yourself. We review every application within 48 hours.
              </p>

              <form onSubmit={handleApply} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bio <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself and your audience..."
                    rows={4}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 resize-none transition-all"
                  />
                </div>

                {/* Social handles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Instagram Handle</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="yourhandle"
                        className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube Channel</label>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="Channel name or URL"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 transition-all"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 transition-all"
                  />
                </div>

                {/* Payout method tabs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payout Method</label>
                  <div className="flex gap-2 mb-3">
                    {PAYOUT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setPayoutMethod(m); setPayoutDetails(''); }}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all capitalize ${
                          payoutMethod === m
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                        }`}
                      >
                        {m === 'upi' ? 'UPI' : m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>

                  {payoutMethod !== 'wallet' && (
                    <input
                      type="text"
                      value={payoutDetails}
                      onChange={(e) => setPayoutDetails(e.target.value)}
                      placeholder={PAYOUT_PLACEHOLDERS[payoutMethod]}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent placeholder-gray-400 transition-all"
                    />
                  )}
                  {payoutMethod === 'wallet' && (
                    <p className="text-sm text-gray-400 italic">{PAYOUT_PLACEHOLDERS.wallet}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                >
                  {submitting ? 'Submitting...' : 'Apply Now 💄'}
                </button>
              </form>
            </div>

            {/* Perks sidebar */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why Join GlowBox Affiliates?</h3>
              <div className="space-y-4">
                {[
                  { icon: '💰', title: '10% Commission', desc: 'Earn on every sale referred through your unique link.' },
                  { icon: '🍪', title: '30-Day Cookie', desc: 'Get credited even if your audience buys 30 days later.' },
                  { icon: '📊', title: 'Real-Time Dashboard', desc: 'Track clicks, orders, and earnings live.' },
                  { icon: '💳', title: 'Flexible Payouts', desc: 'Get paid via UPI, bank transfer, or wallet every month.' },
                  { icon: '🎁', title: 'Exclusive Perks', desc: 'Top affiliates get free products and early access.' },
                ].map((perk) => (
                  <div key={perk.title} className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
                    <div className="text-2xl">{perk.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{perk.title}</h4>
                      <p className="text-sm text-gray-500">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
