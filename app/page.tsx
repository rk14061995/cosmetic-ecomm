import Link from 'next/link';
import type { Metadata } from 'next';
import FeaturedProducts from '@/components/products/FeaturedProducts';
import MysteryBoxPreview from '@/components/products/MysteryBoxPreview';
import BlogTeaser from '@/components/home/BlogTeaser';
import ProductSplit from '@/components/home/ProductSplit';
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel';
import DynamicCategories from '@/components/home/DynamicCategories';
import ShopByBrand from '@/components/home/ShopByBrand';
import {
  DEFAULT_DESCRIPTION,
  KEYWORDS,
  SITE_TAGLINE,
  absoluteUrl,
  defaultOpenGraph,
  defaultTwitter,
  getSiteName,
} from '@/lib/seo';

const homeTitle = `${getSiteName()} — ${SITE_TAGLINE} | Shop Online India`;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  alternates: { canonical: '/' },
  openGraph: defaultOpenGraph({
    title: homeTitle,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl('/'),
  }),
  twitter: defaultTwitter({
    title: homeTitle,
    description: DEFAULT_DESCRIPTION,
  }),
};

const featureCards = [
  { icon: '⚡', title: 'Flash Sale',       subtitle: 'Up to 50% off',         href: '/sale',        accent: 'bg-rose-600',   card: 'from-rose-50 to-red-50',      border: 'border-rose-100'   },
  { icon: '◇',  title: 'Beauty Quiz',      subtitle: 'Find your perfect match',href: '/quiz',        accent: 'bg-pink-500',   card: 'from-pink-50 to-rose-50',     border: 'border-pink-100'   },
  { icon: '◎',  title: 'Subscribe',        subtitle: 'Monthly beauty box',     href: '/subscribe',   accent: 'bg-violet-500', card: 'from-violet-50 to-purple-50', border: 'border-violet-100' },
  { icon: '◈',  title: 'Bundles',          subtitle: 'Curated sets, save more',href: '/bundles',     accent: 'bg-teal-500',   card: 'from-teal-50 to-cyan-50',     border: 'border-teal-100'   },
  { icon: '◉',  title: 'Gift Cards',       subtitle: 'Give the gift of glow',  href: '/gift-cards',  accent: 'bg-amber-500',  card: 'from-amber-50 to-yellow-50',  border: 'border-amber-100'  },
];

async function fetchProductStats(): Promise<{ totalProducts: number; averageRating: number }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/stats`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('stats fetch failed');
    const data = await res.json();
    return { totalProducts: data.totalProducts ?? 0, averageRating: data.averageRating ?? 0 };
  } catch {
    return { totalProducts: 0, averageRating: 0 };
  }
}

export default async function HomePage() {
  const { totalProducts, averageRating } = await fetchProductStats();

  const productStat = totalProducts > 0 ? `${totalProducts}+` : '500+';
  const ratingStat = averageRating > 0
    ? averageRating.toFixed(1)
    : '4.8';

  const trustItems = [
    { stat: productStat, label: 'Products'        },
    { stat: '50K+',      label: 'Happy Customers' },
    { stat: ratingStat,  label: 'Average Rating'  },
    { stat: '100%',      label: 'Authentic'       },
  ];

  return (
    <div className="bg-[#fdfbf9]">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#fdfbf9]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-[500px] h-[500px] rounded-full bg-cyan-100/40 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-indigo-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-semibold tracking-[0.15em] text-indigo-500 uppercase">New Collection · Spring 2025</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-black text-neutral-900 leading-[1.05] tracking-tight mb-6">
                K-Beauty
                <br />
                <span className="font-thin italic bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Crafted</span>
                <span className="block font-black">For Your Skin</span>
              </h1>

              <p className="text-base text-neutral-500 leading-relaxed max-w-md mb-10 font-light">
                Authentic Korean skincare, makeup and mystery boxes — curated for every skin type and delivered fast across India.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-14">
                <Link
                  href="/products"
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-sm tracking-wide px-8 py-3.5 rounded-full hover:shadow-lg hover:shadow-indigo-200/60 hover:scale-[1.02] transition-all"
                >
                  Shop Collection
                </Link>
                <Link
                  href="/quiz"
                  className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-500 font-semibold text-sm px-6 py-3.5 rounded-full hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <span className="text-xs">◇</span> Take Skin Quiz
                </Link>
              </div>

              {/* Trust stats */}
              <div className="flex gap-8">
                {trustItems.map((t) => (
                  <div key={t.label}>
                    <div className="text-xl font-black text-neutral-900">{t.stat}</div>
                    <div className="text-xs text-neutral-400 font-medium mt-0.5">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-[480px] h-[480px]">
                <div className="absolute inset-0 rounded-full border border-indigo-100" />
                <div className="absolute inset-6 rounded-full border border-cyan-100/60" />
                {/* Center card */}
                <div className="absolute inset-12 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-cyan-50 backdrop-blur-sm border border-white/80 shadow-2xl shadow-indigo-100/60 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-4xl shadow-lg shadow-indigo-200/50">✨</div>
                  <div className="text-center px-6">
                    <p className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase mb-1">Bestseller</p>
                    <p className="text-sm font-semibold text-neutral-800">Hydra-Glow Moisturizer</p>
                    <p className="text-xs text-neutral-400 mt-0.5">SPF 50 · Hyaluronic Acid</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-amber-400 text-xs">★</span>
                    ))}
                    <span className="text-xs text-neutral-400 ml-1">(2.4k)</span>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute top-8 -right-4 bg-white rounded-2xl shadow-lg border border-indigo-50 px-4 py-2.5 text-center">
                  <p className="text-xs font-bold text-neutral-900">K-Beauty</p>
                  <p className="text-[10px] text-indigo-400 font-medium">Certified</p>
                </div>
                <div className="absolute bottom-12 -left-6 bg-white rounded-2xl shadow-lg border border-indigo-50 px-4 py-2.5">
                  <p className="text-[10px] text-neutral-400">Free shipping</p>
                  <p className="text-xs font-bold text-neutral-900">above ₹500</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '◎', title: 'Free Shipping',   desc: 'On orders above ₹500'  },
              { icon: '◇', title: 'Easy Returns',    desc: '7-day return policy'    },
              { icon: '◈', title: 'Secure Payment',  desc: 'Razorpay encrypted'     },
              { icon: '◉', title: '100% Authentic',  desc: 'Genuine products only'  },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-5 rounded-2xl bg-[#fdfbf9] border border-neutral-100">
                <span className="text-xl text-rose-300 flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">{f.title}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-rose-400 uppercase mb-2">Curated For You</p>
              <h2 className="text-3xl font-black text-neutral-900">Featured Products</h2>
              <p className="text-neutral-400 mt-1 font-light text-sm">Handpicked by our K-beauty experts</p>
            </div>
            <Link href="/products?featured=true" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors font-medium">
              View all →
            </Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      {/* ── CATEGORY STRIP ───────────────────────────────────────────── */}
      <section className="py-16 bg-[#fdfbf9] border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-rose-400 uppercase mb-2">Explore</p>
              <h2 className="text-3xl font-black text-neutral-900">Shop by Category</h2>
            </div>
            <Link href="/products" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors font-medium">
              View all →
            </Link>
          </div>
          <DynamicCategories />
        </div>
      </section>

      {/* ── FEATURE STRIP ────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-[#fdfbf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase mb-2">Discover More</p>
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900">Everything kosmeticX</h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-xl">
                Elevated experiences beyond shopping - personalized routines, curated bundles, gifting, and more.
              </p>
            </div>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
            {featureCards.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className={`group relative min-w-[82%] sm:min-w-0 snap-start rounded-[2rem] p-[1px] bg-gradient-to-br from-white via-white to-indigo-100/70 hover:-translate-y-1.5 transition-all duration-300`}
              >
                <div className={`relative rounded-[calc(2rem-1px)] bg-gradient-to-br ${f.card} border ${f.border} px-5 py-6 min-h-[215px] overflow-hidden`}>
                  <div className="absolute -top-16 -right-10 w-36 h-36 rounded-full bg-white/60 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-14 w-40 h-40 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start justify-between gap-4 mb-5">
                    <div className={`w-12 h-12 ${f.accent} rounded-full flex items-center justify-center text-white text-lg shadow-lg ring-4 ring-white/70 group-hover:scale-110 transition-transform`}>
                      {f.icon}
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-neutral-400">
                      kosmeticX Pick
                    </span>
                  </div>
                  <p className="relative font-black text-neutral-900 text-lg mb-1.5 tracking-tight">{f.title}</p>
                  <p className="relative text-sm text-neutral-600 leading-snug max-w-[16rem]">{f.subtitle}</p>
                  <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    <span>Explore</span>
                    <span className="w-6 h-6 rounded-full bg-white/95 border border-indigo-200 flex items-center justify-center text-[11px] shadow-sm group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <TestimonialsCarousel />

      {/* ── MYSTERY BOXES ────────────────────────────────────────────── */}
      <MysteryBoxPreview />

      {/* ── BESTSELLERS + NEW ARRIVALS ──────────────────────────────── */}
      <ProductSplit />

      <ShopByBrand />

      {/* ── BLOG TEASER ──────────────────────────────────────────────── */}
      <BlogTeaser />

      {/* ── REFERRAL BANNER ──────────────────────────────────────────── */}
      <section className="py-16 bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-rose-400 uppercase mb-3">Referral Program</p>
          <h2 className="text-3xl font-black text-white mb-3">Share & Earn Together</h2>
          <p className="text-neutral-400 mb-8 font-light text-sm max-w-md mx-auto">
            Invite friends and earn ₹100 wallet credit. Your friend gets ₹50 off their first order.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 bg-white text-neutral-900 font-bold text-sm px-8 py-3.5 rounded-full hover:bg-rose-50 transition-colors hover:shadow-lg"
          >
            Get Your Referral Code →
          </Link>
        </div>
      </section>

    </div>
  );
}
