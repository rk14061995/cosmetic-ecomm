'use client';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

// ── Loyalty tier config ──────────────────────────────────────────────────────
const TIERS = [
  { name: 'Bronze',   next: 'Silver',   cap: 500,  from: 'from-amber-400',  to: 'to-orange-400',  bg: 'from-amber-50 to-orange-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-800',   bar: 'bg-amber-400'   },
  { name: 'Silver',   next: 'Gold',     cap: 2000, from: 'from-gray-400',   to: 'to-slate-400',   bg: 'from-gray-50 to-slate-50',     border: 'border-gray-200',    badge: 'bg-gray-200 text-gray-700',     bar: 'bg-gray-400'    },
  { name: 'Gold',     next: 'Platinum', cap: 5000, from: 'from-yellow-400', to: 'to-amber-400',   bg: 'from-yellow-50 to-amber-50',   border: 'border-yellow-200',  badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400'  },
  { name: 'Platinum', next: null,       cap: null, from: 'from-purple-500', to: 'to-indigo-500',  bg: 'from-purple-50 to-indigo-50',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-800', bar: 'bg-purple-500'  },
] as const;

function getTierConfig(tierName: string) {
  return TIERS.find((t) => t.name === tierName) ?? TIERS[0];
}

function getLoyaltyProgress(points: number, tierName: string) {
  const cfg = getTierConfig(tierName);
  if (!cfg.cap) return { pct: 100, remaining: 0 };
  const pct = Math.min(100, Math.round((points / cfg.cap) * 100));
  return { pct, remaining: Math.max(0, cfg.cap - points) };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();

  useEffect(() => { if (!user) router.push('/auth/login'); }, [user]);
  if (!user) return null;

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/register?ref=${user.referralCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied!');
  };

  const loyaltyPoints = user.loyaltyPoints || 0;
  const loyaltyTier   = user.loyaltyTier   || 'Bronze';
  const tier          = getTierConfig(loyaltyTier);
  const { pct, remaining } = getLoyaltyProgress(loyaltyPoints, loyaltyTier);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center text-3xl font-bold text-pink-600 mx-auto mb-4">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-lg text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.phone && <p className="text-sm text-gray-500 mt-1">{user.phone}</p>}
            {user.role === 'admin' && (
              <span className="inline-block mt-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">Admin</span>
            )}
          </div>

          {/* Wallet */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
            <p className="text-sm text-amber-700 font-medium mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold text-amber-800">{formatPrice(user.wallet || 0)}</p>
            <p className="text-xs text-amber-600 mt-2">Earned from referrals & rewards</p>
          </div>

          {/* Quick Links */}
          <div className="bg-white border rounded-2xl p-4 space-y-1">
            {[
              { href: '/profile/orders', icon: '📦', label: 'My Orders' },
              { href: '/profile/wishlist', icon: '❤️', label: 'Wishlist' },
              { href: '/cart', icon: '🛒', label: 'Cart' },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors text-sm font-medium text-gray-700">
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors text-sm font-medium text-purple-700">
                <span>⚙️</span>Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Details & Referral */}
        <div className="md:col-span-2 space-y-6">
          {/* Referral */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-1">Refer & Earn 💰</h3>
            <p className="text-pink-100 text-sm mb-4">Share your code and earn ₹100 for each friend who signs up and orders!</p>
            <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between mb-3">
              <span className="font-mono font-bold text-xl tracking-widest">{user.referralCode}</span>
              <button onClick={copyReferral} className="bg-white text-pink-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-pink-50">
                Copy Link
              </button>
            </div>
            <p className="text-xs text-pink-200">Your friends also get ₹50 off their first order!</p>
          </div>

          {/* ── Loyalty Points ────────────────────────────────────────────── */}
          <div className={`bg-gradient-to-br ${tier.bg} border ${tier.border} rounded-2xl p-6`}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="font-bold text-gray-900 text-base">Loyalty Points</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${tier.badge}`}>
                {loyaltyTier}
              </span>
            </div>

            {/* Points count */}
            <div className="mb-4">
              <p className={`text-4xl font-extrabold bg-gradient-to-r ${tier.from} ${tier.to} bg-clip-text text-transparent`}>
                {loyaltyPoints.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">points earned</p>
            </div>

            {/* Progress bar */}
            {tier.cap ? (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{loyaltyTier}</span>
                  <span>{tier.next}</span>
                </div>
                <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tier.bar} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {remaining > 0
                    ? <><span className="font-semibold text-gray-700">{remaining.toLocaleString()} pts</span> to reach {tier.next}</>
                    : <span className="font-semibold text-green-600">You've hit the threshold — upgrade incoming!</span>
                  }
                </p>
              </div>
            ) : (
              <div className="mb-3">
                <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${tier.bar} w-full`} />
                </div>
                <p className="text-xs font-semibold text-purple-600 mt-1.5">🏆 Maximum tier reached — you're Platinum!</p>
              </div>
            )}

            {/* How to earn */}
            <div className="mt-3 pt-3 border-t border-white/50">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">How to earn:</span>{' '}
                Earn 1 point for every ₹10 spent
              </p>
            </div>
          </div>
          {/* ── /Loyalty Points ──────────────────────────────────────────── */}

          {/* Addresses */}
          <div className="bg-white border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Saved Addresses</h3>
              <Link href="/checkout" className="text-sm text-pink-600 hover:text-pink-700 font-medium">+ Add</Link>
            </div>
            {user.addresses?.length === 0 ? (
              <p className="text-sm text-gray-400">No addresses saved yet.</p>
            ) : (
              <div className="space-y-3">
                {user.addresses?.map((addr: any) => (
                  <div key={addr._id} className="border rounded-xl p-4 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{addr.fullName}</p>
                      {addr.isDefault && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-gray-500">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                    <p className="text-gray-500">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="text-gray-500">{addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
