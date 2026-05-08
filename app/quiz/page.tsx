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
    document.title = 'Skin & Beauty Quiz | Glowzy';
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
          setProducts(data.products || []);
        } catch {
          setProducts([]);
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
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
          </div>
          <p className="text-xl font-bold text-pink-700">Finding your perfect matches…</p>
          <p className="text-sm text-pink-400 mt-2">Curating picks just for you</p>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50">
        {/* Results header */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 py-14 px-4 text-center">
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold px-8 py-4 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 text-base"
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 flex flex-col">
      {/* Top progress section */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-pink-500 uppercase tracking-widest">
              Skin &amp; Beauty Quiz
            </span>
            <span className="text-xs font-bold text-gray-500">
              {step + 1} / {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 bg-pink-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 transition-all duration-700 ease-out"
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
                    ? 'bg-pink-500'
                    : i === step
                    ? 'bg-rose-400 scale-125'
                    : 'bg-pink-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <StepCard stepKey={step}>
            {/* Question card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-pink-100 p-8 md:p-10">
              {/* Question heading */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white font-extrabold text-lg mb-4 shadow-md">
                  {step + 1}
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                  {current.q}
                </h2>
              </div>

              {/* Option cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {current.options.map((opt) => {
                  const isActive = selected === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelect(opt.label)}
                      className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 focus:outline-none ${
                        isActive
                          ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-rose-50 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50 hover:scale-[1.01]'
                      }`}
                    >
                      {/* Checkmark indicator */}
                      {isActive && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold">
                          ✓
                        </span>
                      )}
                      <span className="text-3xl leading-none">{opt.emoji}</span>
                      <span
                        className={`text-sm font-semibold leading-tight ${
                          isActive ? 'text-pink-700' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-pink-300 hover:text-pink-600 transition-all"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!selected}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    selected
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {step === totalSteps - 1 ? 'See My Results ✨' : 'Next →'}
                </button>
              </div>
            </div>
          </StepCard>

          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-40 -left-20 w-72 h-72 rounded-full bg-pink-300/20 blur-3xl -z-10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-fuchsia-300/20 blur-3xl -z-10"
          />
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-8 text-xs text-pink-400 font-medium">
        Your answers help us personalise your Glowzy experience 🌸
      </div>
    </div>
  );
}
