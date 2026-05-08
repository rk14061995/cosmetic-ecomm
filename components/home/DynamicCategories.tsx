'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const FALLBACK_ICONS = ['◇', '◈', '◉', '◌', '◎', '◆'];
const FALLBACK_COLORS = [
  'from-indigo-50 to-cyan-50 border-indigo-100',
  'from-sky-50 to-blue-50 border-sky-100',
  'from-emerald-50 to-teal-50 border-emerald-100',
  'from-violet-50 to-indigo-50 border-violet-100',
  'from-amber-50 to-yellow-50 border-amber-100',
  'from-slate-50 to-zinc-50 border-slate-200',
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {categories.map((cat, idx) => (
        <Link
          key={cat._id}
          href={`/products?category=${encodeURIComponent(cat.name)}`}
          className={`group bg-gradient-to-br ${FALLBACK_COLORS[idx % FALLBACK_COLORS.length]} border rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
        >
          <span className="text-2xl text-neutral-400 group-hover:text-indigo-500 transition-colors font-thin">
            {FALLBACK_ICONS[idx % FALLBACK_ICONS.length]}
          </span>
          <span className="text-xs font-semibold text-neutral-600 text-center leading-tight">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
