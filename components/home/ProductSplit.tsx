'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

export default function ProductSplit() {
  const [popular, setPopular] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?bestSeller=true&limit=8'),
      api.get('/products?newArrival=true&limit=8'),
    ])
      .then(([popularRes, newestRes]) => {
        const bestSeller = popularRes.data?.products || [];
        const newArrival = newestRes.data?.products || [];

        if (bestSeller.length > 0) setPopular(bestSeller);
        else {
          api.get('/products?sort=popular&limit=8')
            .then(({ data }) => setPopular(data.products || []))
            .catch(() => setPopular([]));
        }

        if (newArrival.length > 0) setNewArrivals(newArrival);
        else {
          api.get('/products?sort=newest&limit=8')
            .then(({ data }) => setNewArrivals(data.products || []))
            .catch(() => setNewArrivals([]));
        }
      })
      .catch(() => {
        setPopular([]);
        setNewArrivals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-[#f8faff] border-t border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i}>
                <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((__, j) => (
                    <div key={j} className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#f8faff] border-t border-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-indigo-500 mb-1">Most Loved</p>
                <h3 className="text-2xl font-black text-neutral-900">Bestsellers</h3>
              </div>
              <Link href="/products?bestSeller=true" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {popular.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-cyan-600 mb-1">Just In</p>
                <h3 className="text-2xl font-black text-neutral-900">New Arrivals</h3>
              </div>
              <Link href="/products?newArrival=true" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
