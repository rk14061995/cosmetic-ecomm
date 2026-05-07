'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/store/slices/cartSlice';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const TIER_CONFIG: Record<string, { color: string; gradient: string; badge: string }> = {
  basic: { color: 'from-pink-400 to-rose-400', gradient: 'from-pink-50 to-rose-50', badge: 'bg-pink-100 text-pink-700' },
  standard: { color: 'from-purple-500 to-pink-500', gradient: 'from-purple-50 to-pink-50', badge: 'bg-purple-100 text-purple-700' },
  premium: { color: 'from-yellow-400 to-orange-400', gradient: 'from-yellow-50 to-orange-50', badge: 'bg-yellow-100 text-yellow-800' },
};

export default function MysteryBoxesPage() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    api.get('/mystery-boxes')
      .then(({ data }) => setBoxes(data.mysteryBoxes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (box: any) => {
    if (!user) { router.push('/auth/login'); return; }
    const result = await dispatch(addToCart({ itemId: box._id, itemType: 'mysteryBox', quantity: 1 }));
    if (addToCart.fulfilled.match(result)) {
      toast.success(`${box.name} added to cart! 🎁`);
    } else {
      toast.error(result.payload as string || 'Failed to add');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="text-6xl mb-4 animate-bounce">🎁</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Mystery Beauty Boxes
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Surprise yourself with a curated selection of premium beauty products.
          Every box is hand-picked by our experts — the thrill is in the unboxing!
        </p>
      </div>

      {/* How it Works */}
      <div className="grid md:grid-cols-4 gap-6 mb-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-8">
        <h2 className="md:col-span-4 text-xl font-bold text-gray-900 text-center mb-2">How It Works</h2>
        {[
          { step: '1', icon: '🛒', title: 'Choose a Tier', desc: 'Pick the box that fits your budget' },
          { step: '2', icon: '✅', title: 'Place Order', desc: 'Checkout securely with Razorpay' },
          { step: '3', icon: '📦', title: 'We Curate', desc: 'Our experts pack your surprise' },
          { step: '4', icon: '😍', title: 'Unbox & Glow', desc: 'Discover your beauty treasures' },
        ].map((s) => (
          <div key={s.step} className="text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
            <p className="text-sm text-gray-500">{s.desc}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-3xl h-96" />)}
        </div>
      ) : boxes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500">No mystery boxes available right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {boxes.map((box) => {
            const config = TIER_CONFIG[box.tier] || TIER_CONFIG.basic;
            const isPopular = box.tier === 'standard';
            return (
              <div key={box._id} className={`relative bg-gradient-to-br ${config.gradient} rounded-3xl overflow-hidden border border-white shadow-sm hover:shadow-xl transition-all group`}>
                {isPopular && (
                  <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className={`h-3 bg-gradient-to-r ${config.color}`} />

                <div className="p-8">
                  <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden bg-white/50">
                    {box.image ? (
                      <Image src={box.image} alt={box.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl">🎁</div>
                    )}
                  </div>

                  <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase ${config.badge}`}>
                    {box.tier}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{box.name}</h2>
                  <p className="text-gray-500 text-sm mb-4">{box.description}</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{formatPrice(box.price)}</span>
                    <span className="text-sm text-green-600 font-medium">Worth {formatPrice(box.minValue)}+</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-pink-500">✓</span>
                      <span>{box.minProducts}–{box.maxProducts} premium products</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-pink-500">✓</span>
                      <span>Minimum value {formatPrice(box.minValue)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-pink-500">✓</span>
                      <span>Free shipping included</span>
                    </div>
                  </div>

                  {box.possibleItems?.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Possible Items Preview</p>
                      <div className="flex gap-2 flex-wrap">
                        {box.possibleItems.slice(0, 4).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-1 bg-white/70 rounded-full px-3 py-1 text-xs text-gray-700">
                            {item.image && <Image src={item.image} alt={item.name} width={16} height={16} className="rounded-full" />}
                            {item.name}
                          </div>
                        ))}
                        {box.possibleItems.length > 4 && (
                          <span className="text-xs text-gray-400 px-2 py-1">+{box.possibleItems.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAddToCart(box)}
                      disabled={box.stock === 0}
                      className={`flex-1 bg-gradient-to-r ${config.color} text-white font-semibold py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      {box.stock === 0 ? 'Sold Out' : 'Add to Cart 🎁'}
                    </button>
                    <button
                      onClick={() => setSelected(selected?._id === box._id ? null : box)}
                      className="px-4 py-3 rounded-full border-2 border-gray-200 hover:border-pink-300 text-sm font-medium transition-all"
                    >
                      {selected?._id === box._id ? '▲' : '▼'}
                    </button>
                  </div>

                  {selected?._id === box._id && box.possibleItems?.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">All Possible Items:</p>
                      <div className="space-y-2">
                        {box.possibleItems.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="text-pink-400">•</span>
                            <span className="font-medium">{item.name}</span>
                            {item.description && <span className="text-gray-400 text-xs">— {item.description}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { q: 'Can I choose what goes in my box?', a: 'No — that\'s the fun of it! All contents are a surprise, curated by our team based on your box tier.' },
            { q: 'Are the products full-size?', a: 'Most products are full-size. Premium boxes contain exclusively full-size products.' },
            { q: 'What if I receive a product I dislike?', a: 'We cannot swap individual products, but you can return the entire box within 7 days if unopened.' },
            { q: 'How often do box contents change?', a: 'We update our curation monthly so repeat customers always get fresh discoveries.' },
          ].map((faq, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
