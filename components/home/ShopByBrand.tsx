'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function ShopByBrand() {
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    api.get('/brands')
      .then(({ data }) => setBrands(data.brands || []))
      .catch(() => setBrands([]));
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-[#f8faff] to-[#fdfbf9] border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase mb-2">Brand Edit</p>
            <h2 className="text-3xl font-black text-neutral-900">Shop by Brand</h2>
            <p className="text-sm text-neutral-500 mt-2 font-light">Browse top Indian and international beauty names.</p>
          </div>
          <Link href="/products" className="hidden sm:inline-flex text-sm text-neutral-500 hover:text-neutral-800 transition-colors font-semibold">
            View all brands →
          </Link>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
          {brands.map((brand) => (
            <Link
              key={brand._id}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="group min-w-[190px] sm:min-w-0 relative rounded-[1.8rem] p-[1px] bg-gradient-to-br from-white via-white to-indigo-100/70 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="relative rounded-[calc(1.8rem-1px)] bg-gradient-to-b from-white to-slate-50/70 border border-slate-100 px-4 py-5 min-h-[185px] overflow-hidden">
                <div className="absolute -top-12 -right-10 w-28 h-28 rounded-full bg-indigo-100/45 blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -bottom-16 -left-10 w-28 h-28 rounded-full bg-sky-100/45 blur-2xl pointer-events-none" />
                <div className="relative w-16 h-16 mx-auto mb-3 rounded-full bg-white shadow-sm ring-1 ring-slate-100 p-3">
                  <Image
                    src={brand.image}
                    alt={brand.name}
                    fill
                    className="object-contain p-2"
                    sizes="64px"
                  />
                </div>
                <p className="text-sm font-bold text-neutral-700 text-center group-hover:text-indigo-700 transition-colors">
                  {brand.name}
                </p>
                <p className="text-[11px] text-neutral-400 text-center mt-1 capitalize">{brand.origin}</p>
                <div className="mt-3 text-center text-[11px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore products →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link href="/products" className="inline-flex text-sm text-neutral-500 hover:text-neutral-800 transition-colors font-semibold">
            View all brands →
          </Link>
        </div>
      </div>
    </section>
  );
}
