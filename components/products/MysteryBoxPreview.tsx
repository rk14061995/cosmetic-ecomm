'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/store/slices/cartSlice';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const TIER_STYLE: Record<string, { bar: string; badge: string; label: string; popular?: boolean }> = {
  basic:    { bar: 'bg-rose-300',    badge: 'bg-rose-50 text-rose-600 border-rose-100',   label: 'Starter'  },
  standard: { bar: 'bg-violet-400',  badge: 'bg-violet-50 text-violet-600 border-violet-100', label: 'Popular', popular: true },
  premium:  { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Luxe'    },
};

export default function MysteryBoxPreview() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    api.get('/mystery-boxes')
      .then(({ data }) => setBoxes((data.mysteryBoxes || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (box: any) => {
    if (!user) { router.push('/auth/login'); return; }
    const result = await dispatch(addToCart({ itemId: box._id, itemType: 'mysteryBox', quantity: 1 } as any));
    if (addToCart.fulfilled.match(result)) {
      toast.success(`${box.name} added to cart!`);
    } else {
      toast.error((result.payload as string) || 'Failed to add to cart');
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0b1120] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-300 uppercase mb-3">Signature Experience</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Mystery Beauty<br />
              <span className="font-thin italic text-fuchsia-300">Boxes</span>
            </h2>
            <p className="text-indigo-100/85 mt-4 font-light text-sm md:text-base max-w-xl">
              The most-loved Glowzy feature: each Mystery Box is hand-curated by our team with premium K-beauty + global icons.
              Unbox discovery, value, and delight in every order.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                'Up to 40% better value',
                'Curated by beauty experts',
                'Fresh picks every month',
              ].map((point) => (
                <span
                  key={point}
                  className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-100"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/mystery-boxes"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 text-sm font-bold px-7 py-3 rounded-full transition-all shadow-lg"
          >
            Explore Mystery Boxes →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10">
          {[
            { k: '10K+', v: 'Boxes shipped' },
            { k: '4.8/5', v: 'Average rating' },
            { k: '7-Day', v: 'Easy return (unopened)' },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl bg-white/10 border border-white/20 p-4 text-center">
              <p className="text-white font-black text-xl">{s.k}</p>
              <p className="text-indigo-100 text-xs md:text-sm mt-1">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : boxes.length === 0 ? (
          <p className="text-neutral-500 text-center py-10">Mystery boxes coming soon.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {boxes.map((box) => {
              const style = TIER_STYLE[box.tier] || TIER_STYLE.basic;
              return (
                <div
                  key={box._id}
                  className="relative bg-white/10 border border-white/20 rounded-3xl overflow-hidden hover:border-cyan-300/60 hover:bg-white/15 transition-all group backdrop-blur"
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full ${style.bar}`} />

                  {style.popular && (
                    <div className="absolute top-5 right-5 bg-violet-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase">
                      Most Popular
                    </div>
                  )}

                  <div className="p-6">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider mb-4 ${style.badge}`}>
                      {style.label}
                    </span>

                    <h3 className="text-lg font-bold text-white mb-1">{box.name}</h3>
                    <p className="text-indigo-100/70 text-xs mb-4 font-light">{box.minProducts}–{box.maxProducts} premium products · worth {formatPrice(box.minValue)}+</p>

                    <div className="text-3xl font-black text-white mb-6">
                      {formatPrice(box.price)}
                      <span className="text-sm font-normal text-neutral-500 ml-2">/ box</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(box)}
                      disabled={box.stock === 0}
                      className="w-full bg-gradient-to-r from-indigo-400 to-cyan-400 text-white font-bold text-sm py-3 rounded-2xl hover:from-indigo-300 hover:to-cyan-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {box.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom note */}
        <p className="text-center text-indigo-100/70 text-xs mt-10 font-light">
          Free shipping on all mystery boxes · Tamper-safe packing · 7-day return policy if unopened
        </p>
      </div>
    </section>
  );
}
