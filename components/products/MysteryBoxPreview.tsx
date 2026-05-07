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
    <section className="py-20 bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-rose-400 uppercase mb-3">Exclusive</p>
            <h2 className="text-4xl font-black text-white leading-tight">
              Mystery Beauty<br />
              <span className="font-thin italic text-rose-300">Boxes</span>
            </h2>
            <p className="text-neutral-400 mt-3 font-light text-sm max-w-md">
              Surprise yourself with a hand-curated box of premium K-beauty and global products.
              Every box is different — the joy is in the discovery.
            </p>
          </div>
          <Link
            href="/mystery-boxes"
            className="flex-shrink-0 inline-flex items-center gap-2 border border-neutral-600 text-neutral-300 hover:border-rose-400 hover:text-rose-400 text-sm font-semibold px-6 py-3 rounded-full transition-all"
          >
            See All Boxes →
          </Link>
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
                  className="relative bg-neutral-800/60 border border-neutral-700 rounded-3xl overflow-hidden hover:border-neutral-500 hover:bg-neutral-800 transition-all group"
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
                    <p className="text-neutral-500 text-xs mb-4 font-light">{box.minProducts}–{box.maxProducts} premium products · worth {formatPrice(box.minValue)}+</p>

                    <div className="text-3xl font-black text-white mb-6">
                      {formatPrice(box.price)}
                      <span className="text-sm font-normal text-neutral-500 ml-2">/ box</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(box)}
                      disabled={box.stock === 0}
                      className="w-full bg-white text-neutral-900 font-bold text-sm py-3 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
        <p className="text-center text-neutral-600 text-xs mt-10 font-light">
          Free shipping on all mystery boxes · 7-day return policy if unopened
        </p>
      </div>
    </section>
  );
}
