'use client';
import { useEffect, useState } from 'react';

const TESTIMONIALS = [
  { name: 'Aisha R.', city: 'Mumbai', quote: 'My skin texture changed in 3 weeks. Lightweight formulas, zero irritation.', rating: 5 },
  { name: 'Sana K.', city: 'Delhi', quote: 'The mystery box was actually worth it. Every product was usable and premium.', rating: 5 },
  { name: 'Priya M.', city: 'Bengaluru', quote: 'Glowzy recommendations are spot on. The quiz gave me a perfect routine.', rating: 5 },
  { name: 'Ritika J.', city: 'Pune', quote: 'Packaging, delivery, product quality — all 10/10. My go-to beauty store now.', rating: 5 },
];

export default function TestimonialsCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-500 mb-2">Community Love</p>
          <h2 className="text-3xl font-black text-neutral-900">What Glowzy Customers Say</h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TESTIMONIALS.map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              className={`rounded-2xl border p-5 transition-all duration-300 ${
                active === index
                  ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-cyan-50 shadow-md'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="text-amber-400 text-sm mb-2">{'★'.repeat(item.rating)}</div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">“{item.quote}”</p>
              <div className="text-sm font-semibold text-neutral-900">{item.name}</div>
              <div className="text-xs text-slate-400">{item.city}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
