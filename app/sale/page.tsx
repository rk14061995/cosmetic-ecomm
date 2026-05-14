'use client';
import { useState, useEffect, Fragment } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import type { Product } from '@/types/api';

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(() => endsAt - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(endsAt - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (timeLeft <= 0) {
    return (
      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
        EXPIRED
      </span>
    );
  }

  const totalSeconds = Math.floor(timeLeft / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  const segments = [
    { val: pad(h), unit: 'h' },
    { val: pad(m), unit: 'm' },
    { val: pad(s), unit: 's' },
  ];

  return (
    <div className="w-full sm:w-auto" aria-label={`Ends in ${h} hours ${m} minutes ${s} seconds`}>
      {/* Mobile: 3-up timer, no squeezed “h : m : s” row */}
      <div className="grid grid-cols-3 gap-1 sm:hidden">
        {segments.map(({ val, unit }) => (
          <div
            key={unit}
            className="flex flex-col items-center gap-0.5 rounded-lg bg-white border border-gray-200/80 px-1 py-1.5"
          >
            <span className="bg-gray-900 text-white text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md min-w-[1.75rem] text-center tabular-nums leading-none">
              {val}
            </span>
            <span className="text-gray-500 text-[9px] font-bold uppercase">{unit}</span>
          </div>
        ))}
      </div>
      {/* sm+: single row with colons */}
      <div className="hidden sm:flex sm:items-center sm:gap-0.5">
        {segments.map(({ val, unit }, idx) => (
          <Fragment key={unit}>
            {idx > 0 && <span className="text-gray-400 font-bold text-xs px-0.5">:</span>}
            <span className="flex items-center gap-0.5">
              <span className="bg-gray-900 text-white text-xs font-mono font-bold px-1.5 py-0.5 rounded-md min-w-[26px] text-center tabular-nums">
                {val}
              </span>
              <span className="text-gray-400 text-[10px] font-semibold">{unit}</span>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Sale Product Card ────────────────────────────────────────────────────────

function SaleCard({ product, endsAt }: { product: Product; endsAt: number }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, authReady } = useAuthStatus();
  const [adding, setAdding] = useState(false);

  const originalPrice = product.price;
  const salePrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!authReady) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setAdding(true);
    const result = await dispatch(
      addToCart({ itemId: product._id, itemType: 'product', quantity: 1 })
    );
    if (addToCart.fulfilled.match(result)) {
      toast.success('Added to cart!');
    } else {
      toast.error((result.payload as string) || 'Failed to add to cart');
    }
    setAdding(false);
  };

  const ctaGradient = 'linear-gradient(90deg, #ec4899 0%, #fb7185 100%)';
  const badgeGradient = 'linear-gradient(90deg, #ec4899 0%, #fb7185 100%)';

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-pink-200 transition-all duration-300 flex flex-col h-full">
      {/* Image area */}
      <div className="relative aspect-square bg-gradient-to-br from-pink-50 to-rose-50 overflow-hidden">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            💄
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span
              className="inline-flex items-center text-white text-[10px] sm:text-xs font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md"
              style={{ background: badgeGradient }}
            >
              −{discount}%
            </span>
          </div>
        )}

        {/* Flash badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <span className="inline-flex items-center bg-yellow-400 text-yellow-900 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2 rounded-full shadow-sm uppercase tracking-wide">
            ⚡ Flash
          </span>
        </div>

        {/* Out-of-stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card body — roomier on xs 2-col; single-col grid on narrow screens helps too */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-2 min-h-0">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] sm:text-[11px] text-pink-500 font-semibold uppercase tracking-wider truncate">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-0">
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="text-sm sm:text-base font-extrabold text-pink-600 tabular-nums">
            {formatPrice(salePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-[11px] sm:text-xs text-gray-400 line-through tabular-nums">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Countdown — stacked label on very narrow widths */}
        <div className="mt-0.5 rounded-xl bg-gray-50 border border-gray-100 px-2 py-2 sm:px-0 sm:py-0 sm:border-0 sm:bg-transparent">
          <p className="text-[10px] font-semibold text-gray-500 mb-1.5 sm:hidden">Ends in</p>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="hidden sm:inline text-[10px] text-gray-500 font-medium shrink-0">Ends in:</span>
            <CountdownTimer endsAt={endsAt} />
          </div>
        </div>

        {/* Add to cart — solid / inline gradient; Tailwind pink gradients break via globals.css */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          style={product.stock !== 0 && !adding ? { background: ctaGradient } : undefined}
          className={`mt-auto w-full min-h-10 sm:min-h-11 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ring-1 ring-black/5 ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : adding
                ? 'bg-pink-300 text-white cursor-wait'
                : 'text-white hover:shadow-md hover:brightness-[1.05] active:scale-[0.98]'
          }`}
        >
          {adding ? (
            'Adding…'
          ) : product.stock === 0 ? (
            'Out of stock'
          ) : (
            <span className="inline-flex items-center justify-center gap-1.5">
              <span aria-hidden>🛒</span>
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add to cart</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-10 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Animated Stat ────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // Store end-times per product id — generated once, never re-randomised
  const [endTimes, setEndTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    document.title = `Flash Sale | ${process.env.NEXT_PUBLIC_SITE_NAME || 'KosmeticX'}`;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products?limit=12');
        const items: Product[] = data.products || [];
        const saleItems = items.filter((p) => p.discountPrice);
        const finalItems = saleItems.length > 0 ? saleItems : items;

        // Generate end-times once
        const newEndTimes: Record<string, number> = {};
        finalItems.forEach((p) => {
          // 2–24 hours from now, biased towards urgency (2–22.8 h)
          newEndTimes[p._id] = Date.now() + Math.random() * 86400000 * 0.9 + 7200000;
        });

        setEndTimes(newEndTimes);
        setProducts(finalItems);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Dark hero header ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 overflow-hidden">
        {/* Decorative glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-20 w-96 h-96 rounded-full bg-pink-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 right-0 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-40 bg-rose-500/10 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <LiveDot />
            Live Flash Sale
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight mb-4">
            <span className="inline-block animate-bounce mr-3">⚡</span>
            Flash Sale
          </h1>
          <p className="text-pink-200 text-base md:text-xl font-medium mb-8 max-w-lg mx-auto">
            Deals end when the timer hits zero — shop fast before your favourites sell out!
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { icon: '🎁', label: `${products.length || '12'}+ Deals`, sub: 'hand-picked for you' },
              { icon: '⏱️', label: 'Limited Time', sub: 'each deal has its own clock' },
              { icon: '🚚', label: 'Free Shipping', sub: 'on orders above ₹500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3">
                <span className="text-2xl">{s.icon}</span>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">{s.label}</p>
                  <p className="text-pink-300 text-[11px]">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-12">
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-0 left-0 w-full"
            preserveAspectRatio="none"
          >
            <path d="M0 48L1440 48L1440 24C1200 0 960 48 720 24C480 0 240 48 0 24V48Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-16">

        {/* Toolbar */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-extrabold text-gray-900">
                {loading ? 'Loading deals…' : `${products.length} Hot Deals`}
              </h2>
            </div>
            <p className="hidden sm:block max-w-md text-right text-xs font-semibold text-yellow-800 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
              ⚡ Timers are live — grab deals before they end.
            </p>
          </div>
          <p className="sm:hidden text-xs font-semibold text-yellow-800 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-xl">
            ⚡ Each card has its own countdown — check the timer before checkout.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-gray-500 text-lg font-medium">No flash deals right now.</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — new deals drop daily!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map((p) => (
              <SaleCard
                key={p._id}
                product={p}
                endsAt={endTimes[p._id] || 0}
              />
            ))}
          </div>
        )}

        {/* Bottom urgency banner */}
        {!loading && products.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-purple-900 to-pink-900 rounded-3xl p-6 md:p-8 text-center text-white">
            <p className="text-2xl font-black mb-2">
              Don&apos;t miss out! ⚡
            </p>
            <p className="text-pink-200 text-sm md:text-base max-w-md mx-auto">
              These flash prices are only valid while the countdown is live. Once the timer hits zero, prices go back up instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
