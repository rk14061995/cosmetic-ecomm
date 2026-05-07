'use client';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ endsAt }: { endsAt: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(endsAt - Date.now());

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

  return (
    <div className="flex items-center gap-1" aria-label={`Ends in ${h} hours ${m} minutes ${s} seconds`}>
      {[
        { val: pad(h), unit: 'h' },
        { val: pad(m), unit: 'm' },
        { val: pad(s), unit: 's' },
      ].map(({ val, unit }, idx) => (
        <span key={unit} className="flex items-center gap-0.5">
          <span className="bg-gray-900 text-white text-xs font-mono font-bold px-1.5 py-0.5 rounded-md min-w-[26px] text-center tabular-nums">
            {val}
          </span>
          <span className="text-gray-400 text-[10px] font-semibold">{unit}</span>
          {idx < 2 && <span className="text-gray-400 font-bold ml-0.5">:</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Sale Product Card ────────────────────────────────────────────────────────

function SaleCard({ product, endsAt }: { product: any; endsAt: number }) {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);
  const [adding, setAdding] = useState(false);

  const originalPrice = product.price;
  const salePrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
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

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-pink-200 transition-all duration-300 flex flex-col">
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
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md">
              -{discount}%
            </span>
          </div>
        )}

        {/* Flash badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
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

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] text-pink-500 font-semibold uppercase tracking-wider truncate">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-pink-600">
            {formatPrice(salePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-medium shrink-0">Ends in:</span>
          <CountdownTimer endsAt={endsAt} />
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          className={`mt-1 w-full py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : adding
              ? 'bg-pink-300 text-white cursor-wait'
              : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-95'
          }`}
        >
          {adding ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Store end-times per product id — generated once, never re-randomised
  const endTimesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    document.title = 'Flash Sale | GlowBox Cosmetics';
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products?limit=12');
        let items: any[] = data.products || [];
        const saleItems = items.filter((p) => p.discountPrice);
        const finalItems = saleItems.length > 0 ? saleItems : items;

        // Generate end-times once
        finalItems.forEach((p) => {
          if (!endTimesRef.current[p._id]) {
            // 2–24 hours from now, biased towards urgency (2–22.8 h)
            endTimesRef.current[p._id] =
              Date.now() + Math.random() * 86400000 * 0.9 + 7200000;
          }
        });

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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg font-extrabold text-gray-900">
              {loading ? 'Loading deals…' : `${products.length} Hot Deals`}
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            ⚡ Prices drop as timers run out — grab yours now!
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-gray-500 text-lg font-medium">No flash deals right now.</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — new deals drop daily!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map((p: any) => (
              <SaleCard
                key={p._id}
                product={p}
                endsAt={endTimesRef.current[p._id]}
              />
            ))}
          </div>
        )}

        {/* Bottom urgency banner */}
        {!loading && products.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-purple-900 to-pink-900 rounded-3xl p-6 md:p-8 text-center text-white">
            <p className="text-2xl font-black mb-2">
              Don't miss out! ⚡
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
