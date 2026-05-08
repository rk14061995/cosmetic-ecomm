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
    <section className="py-16 bg-[#f8faff] border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase mb-2">Brand Edit</p>
            <h2 className="text-3xl font-black text-neutral-900">Shop by Brand</h2>
          </div>
          <Link href="/products" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors font-medium">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {brands.map((brand) => (
            <Link
              key={brand._id}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="group bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="h-14 relative mb-3">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
              <p className="text-sm font-semibold text-neutral-700 text-center group-hover:text-indigo-700 transition-colors">
                {brand.name}
              </p>
              <p className="text-[11px] text-neutral-400 text-center mt-0.5 capitalize">{brand.origin}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
