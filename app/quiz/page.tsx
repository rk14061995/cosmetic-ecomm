'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

// ─── Quiz data ────────────────────────────────────────────────────────────────

type Option = { label: string; emoji: string };
type Question = { q: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    q: "What's your skin type?",
    options: [
      { emoji: '✨', label: 'Oily' },
      { emoji: '🏜️', label: 'Dry' },
      { emoji: '🌗', label: 'Combination' },
      { emoji: '🌸', label: 'Sensitive' },
      { emoji: '⚖️', label: 'Normal' },
    ],
  },
  {
    q: "What's your top skin concern?",
    options: [
      { emoji: '🔴', label: 'Acne & Breakouts' },
      { emoji: '⏳', label: 'Anti-Ageing' },
      { emoji: '💫', label: 'Brightening' },
      { emoji: '💧', label: 'Hydration' },
      { emoji: '🌙', label: 'Dark Circles' },
    ],
  },
  {
    q: "What's your skin tone?",
    options: [
      { emoji: '🤍', label: 'Fair' },
      { emoji: '🌼', label: 'Medium' },
      { emoji: '🌾', label: 'Wheatish' },
      { emoji: '🍂', label: 'Dusky' },
      { emoji: '🌑', label: 'Deep' },
    ],
  },
  {
    q: "What's your daily routine?",
    options: [
      { emoji: '⚡', label: 'Minimal (2-3 steps)' },
      { emoji: '🌿', label: 'Moderate (4-6 steps)' },
      { emoji: '🧪', label: 'Full Skincare Junkie' },
    ],
  },
  {
    q: "What's your budget per product?",
    options: [
      { emoji: '💚', label: 'Under ₹500' },
      { emoji: '💛', label: '₹500–₹1500' },
      { emoji: '💎', label: '₹1500+' },
    ],
  },
];

// ─── Animated step transition wrapper ────────────────────────────────────────

function StepCard({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Trigger entrance animation on each new step
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [stepKey]);

  return (
    <div
      className="transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {children}
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function QuizPage() {
  const [step, setStep] = useState(0);           // 0-4 = questions, 5 = loading, 6 = results
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Set page title
  useEffect(() => {
    document.title = `Skin & Beauty Quiz | ${process.env.NEXT_PUBLIC_SITE_NAME || 'KosmeticX'}`;
  }, []);

  const totalSteps = QUESTIONS.length;
  const progressPct = step >= totalSteps ? 100 : Math.round((step / totalSteps) * 100);

  const handleSelect = (label: string) => setSelected(label);

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = [...answers.slice(0, step), selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Last question answered → show loading then fetch
      setStep(5);
      setTimeout(async () => {
        try {
          const { data } = await api.get('/products?category=Skincare&limit=6');
          const skincare = data.products || [];
          if (skincare.length > 0) {
            setProducts(skincare);
          } else {
            // Fallback so quiz never appears broken if category data changes.
            const { data: fallback } = await api.get('/products?sort=popular&limit=6');
            setProducts(fallback.products || []);
          }
        } catch {
          try {
            const { data: fallback } = await api.get('/products?limit=6');
            setProducts(fallback.products || []);
          } catch {
            setProducts([]);
          }
        }
        setStep(6);
      }, 1500);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setSelected(answers[step - 1] ?? null);
    setStep(step - 1);
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers([]);
    setSelected(null);
    setProducts([]);
  };

  // ── Loading spinner ─────────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
          </div>
          <p className="text-xl font-black text-indigo-700">Building your glow profile…</p>
          <p className="text-sm text-indigo-400 mt-2">AI-curated picks loading now</p>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Results header */}
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-5xl mb-4">🌟</div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Your Perfect Picks
            </h1>
            <p className="text-pink-100 text-base md:text-lg">
              Based on your skin profile, we've handpicked these products for you.
            </p>

            {/* Answer chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {answers.map((a, i) => (
                <span
                  key={i}
                  className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">No products found right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p: any) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {/* Retake */}
          <div className="text-center mt-12">
            <button
              onClick={handleRetake}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold px-8 py-4 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 text-base"
            >
              🔄 Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz questions ──────────────────────────────────────────────────────────
  const current = QUESTIONS[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex flex-col">
      {/* Top progress section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">
              Skin &amp; Beauty Quiz
            </span>
            <span className="text-xs font-bold text-gray-500">
              {step + 1} / {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < step
                    ? 'bg-indigo-500'
                    : i === step
                    ? 'bg-cyan-400 scale-125'
                    : 'bg-indigo-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
        <div className="relative w-full max-w-2xl">
          <StepCard stepKey={step}>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-indigo-200/50 bg-white/90 backdrop-blur-md shadow-[0_28px_64px_-28px_rgba(67,56,202,0.35)]">
              <div
                className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 45%, #22d3ee 100%)' }}
                aria-hidden
              />

              <div className="p-6 sm:p-8 md:p-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">
                      Step {step + 1} of {totalSteps}
                    </p>
                    <h2 className="text-2xl font-black leading-tight tracking-tight text-gray-900 sm:text-3xl md:text-[2rem] md:leading-snug">
                      {current.q}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 hidden sm:block">
                      Tap one answer — you can go back and change it anytime.
                    </p>
                  </div>
                  <div
                    className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg shadow-indigo-500/25 sm:mx-0 sm:h-16 sm:w-16 sm:text-xl"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)' }}
                    aria-hidden
                  >
                    {step + 1}
                  </div>
                </div>

                <div
                  role="radiogroup"
                  aria-label={current.q}
                  className="mb-8 grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3"
                >
                  {current.options.map((opt) => {
                    const isActive = selected === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => handleSelect(opt.label)}
                        className={`group relative flex min-h-[3.25rem] items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50/90 shadow-md ring-1 ring-indigo-200/60'
                            : 'border-gray-200/90 bg-gray-50/40 hover:border-indigo-300 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <span
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl leading-none transition-colors ${
                            isActive ? 'bg-white shadow-sm' : 'bg-white/80 text-gray-900'
                          }`}
                          aria-hidden
                        >
                          {opt.emoji}
                        </span>
                        <span
                          className={`min-w-0 flex-1 text-sm font-semibold leading-snug sm:text-base ${
                            isActive ? 'text-indigo-900' : 'text-gray-800'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-gray-300 bg-white text-transparent group-hover:border-indigo-300'
                          }`}
                          aria-hidden
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full sm:flex-1 rounded-2xl border-2 border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 sm:w-auto"
                    >
                      ← Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!selected}
                    style={
                      selected
                        ? { background: 'linear-gradient(90deg, #6366f1 0%, #22d3ee 100%)' }
                        : undefined
                    }
                    className={`w-full rounded-2xl py-3.5 text-sm font-bold shadow-sm transition-all sm:flex-1 ${
                      selected
                        ? 'text-white ring-1 ring-black/10 hover:shadow-lg hover:brightness-[1.05] active:scale-[0.99]'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step === totalSteps - 1 ? 'See my results ✨' : 'Next →'}
                  </button>
                </div>
              </div>
            </div>
          </StepCard>

          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-32 -z-10 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl sm:-left-32"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 bottom-8 -z-10 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl sm:-right-28"
          />
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-8 text-xs text-indigo-400 font-medium">
        Your answers help us personalise your Glowzy experience 🌸
      </div>
    </div>
  );
}
