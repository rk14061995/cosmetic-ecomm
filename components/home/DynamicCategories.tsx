'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const FALLBACK_COLORS = [
  'from-white to-indigo-50/40',
  'from-white to-sky-50/40',
  'from-white to-emerald-50/40',
  'from-white to-violet-50/40',
  'from-white to-amber-50/40',
  'from-white to-slate-100/60',
];

export default function DynamicCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {categories.map((cat, idx) => (
        <Link
          key={cat._id}
          href={`/products?category=${encodeURIComponent(cat.name)}`}
          className={`group relative bg-gradient-to-br ${FALLBACK_COLORS[idx % FALLBACK_COLORS.length]} border border-slate-200/80 rounded-[1.6rem] px-4 py-4.5 min-h-[108px] hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
        >
          <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-bold tracking-[0.16em] text-neutral-400 uppercase">Category</span>
          <span className="mt-3 block text-sm font-bold text-neutral-800 leading-tight">
            {cat.name}
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 group-hover:text-indigo-700 transition-colors">
            Shop now <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
