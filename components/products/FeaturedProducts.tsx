'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProductCard from './ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/products/featured');
        const featured = data.products || [];
        if (featured.length > 0) {
          setProducts(featured);
          return;
        }

        // Fallback if no products are manually flagged yet.
        const { data: fallback } = await api.get('/products?sort=popular&limit=8');
        setProducts(fallback.products || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-72" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  );
}
