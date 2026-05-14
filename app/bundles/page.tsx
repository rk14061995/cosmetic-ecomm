'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import type { Bundle, ApiError } from '@/types/api';

const PLACEHOLDER_GRADIENTS = [
  'from-pink-400 to-rose-400',
  'from-purple-400 to-pink-400',
  'from-rose-400 to-orange-300',
  'from-fuchsia-400 to-pink-400',
  'from-pink-500 to-purple-500',
  'from-red-400 to-pink-400',
];

const COMING_SOON_PLACEHOLDERS = [
  { name: 'Best of Seoul', gradient: 'from-indigo-500 to-cyan-500', save: '28%', price: 1499, original: 2082 },
  { name: 'Glow Starter Kit', gradient: 'from-pink-400 to-rose-400', save: '25%', price: 999, original: 1332 },
  { name: 'Night Repair Bundle', gradient: 'from-purple-400 to-pink-400', save: '20%', price: 1299, original: 1624 },
  { name: 'Sun Care Set', gradient: 'from-rose-400 to-orange-300', save: '30%', price: 799, original: 1142 },
];

export default function BundlesPage() {
  const router = useRouter();
  const { user, authReady } = useAuthStatus();

  const [bundles, setBundles]     = useState<Bundle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [addingId, setAddingId]   = useState<string | null>(null);

  useEffect(() => {
    api.get('/bundles')
      .then(({ data }) => setBundles(data.bundles || []))
      .catch(() => setError('Failed to load bundles.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = useCallback(async (bundle: Bundle) => {
    if (!authReady) return;
    if (!user) { router.push('/auth/login'); return; }
    if (addingId) return;
    setAddingId(bundle._id);
    try {
      await api.post('/cart/add', {
        itemId: bundle._id,
        itemType: 'bundle',
        quantity: 1,
      });
      toast.success(`${bundle.name} added to cart!`);
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to add bundle to cart.');
    } finally {
      setAddingId(null);
    }
  }, [user, router, addingId, authReady]);

  const savePct = (original: number, price: number) =>
    Math.round(((original - price) / original) * 100);

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600 text-white py-16 px-4 text-center">
        <div className="text-5xl mb-4">🛍️</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Beauty Bundles</h1>
        <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
          Premium routines in one box. Better value, cleaner picks, faster checkout.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-3xl h-[480px]" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                api.get('/bundles')
                  .then(({ data }) => setBundles(data.bundles || []))
                  .catch(() => setError('Failed to load bundles.'))
                  .finally(() => setLoading(false));
              }}
              className="mt-4 px-6 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all"
            >
              Retry
            </button>
          </div>
        ) : bundles.length === 0 ? (
          /* Coming soon */
          <div>
            <div className="text-center mb-10">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Bundles Coming Soon</h2>
              <p className="text-gray-500">
                We are curating premium sets for you. Here is a live preview, including Best of Seoul:
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {COMING_SOON_PLACEHOLDERS.map((ph, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  {/* Save badge */}
                    <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm px-3 py-1.5 rounded-full shadow-md">
                    SAVE {ph.save}
                  </div>

                  {/* Gradient placeholder image */}
                  <div className={`h-52 bg-gradient-to-br ${ph.gradient} flex items-center justify-center`}>
                    <span className="text-6xl">🛍️</span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{ph.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">Coming soon — be the first to know!</p>

                    <div className="flex items-baseline gap-3 mb-5">
                      <span className="text-3xl font-bold text-indigo-600">{formatPrice(ph.price)}</span>
                      <span className="text-gray-400 line-through text-sm">{formatPrice(ph.original)}</span>
                    </div>

                    <button
                      disabled
                      className="w-full py-3 rounded-full bg-gray-100 text-gray-400 font-semibold cursor-not-allowed text-sm"
                    >
                      Notify Me When Available
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Bundle grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bundles.map((bundle, idx: number) => {
              const price = bundle.bundlePrice ?? bundle.price;
              const saving = bundle.originalPrice && price
                ? savePct(bundle.originalPrice, price)
                : null;
              const gradientClass = PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length];
              const isAdding = addingId === bundle._id;

              return (
                <div
                  key={bundle._id}
                  className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group flex flex-col"
                >
                  {/* Save badge */}
                  {saving !== null && saving > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm px-3 py-1.5 rounded-full shadow-md">
                      SAVE {saving}%
                    </div>
                  )}

                  {/* Image or gradient placeholder */}
                  <div className="relative h-56 overflow-hidden">
                    {bundle.image ? (
                      <Image
                        src={bundle.image}
                        alt={bundle.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                        <span className="text-7xl drop-shadow-md">🛍️</span>
                      </div>
                    )}
                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Name & description */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{bundle.name}</h3>
                    {bundle.description && (
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed">{bundle.description}</p>
                    )}

                    {/* Product chips */}
                    {(bundle.products?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {(bundle.products ?? []).map((item: { _id?: string; name?: string; product?: { name?: string } }, i: number) => (
                          <span
                            key={item._id || i}
                            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-medium"
                          >
                            {item.product?.name ?? item.name ?? 'Product'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pricing — pushed to bottom */}
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-3xl font-bold text-indigo-600">{formatPrice(price)}</span>
                        {bundle.originalPrice && bundle.originalPrice > price && (
                          <span className="text-gray-400 line-through text-base">
                            {formatPrice(bundle.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Items count */}
                      {(bundle.products?.length ?? 0) > 0 && (
                        <p className="text-xs text-gray-400 mb-4">
                          {bundle.products?.length} items included
                        </p>
                      )}

                      <button
                        onClick={() => handleAddToCart(bundle)}
                        disabled={isAdding}
                        className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 group-hover:shadow-indigo-200"
                      >
                        {isAdding ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            Adding...
                          </span>
                        ) : (
                          'Add Bundle to Cart 🛍️'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Value proposition */}
        {!loading && !error && bundles.length > 0 && (
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {[
              { icon: '💰', title: 'Always Cheaper', desc: 'Bundles save you 15–35% vs. buying individually' },
              { icon: '✅', title: 'Expert Curated', desc: 'Every bundle is tested by our beauty team' },
              { icon: '📦', title: 'Free Shipping', desc: 'All bundles ship free, always' },
              { icon: '🎁', title: 'Gift Ready', desc: 'Beautiful packaging for gifting' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
