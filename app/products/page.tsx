'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getFiltersFromParams = () => ({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || '',
    newArrival: searchParams.get('newArrival') || '',
    bestSeller: searchParams.get('bestSeller') || '',
    featured: searchParams.get('featured') || '',
    page: Number(searchParams.get('page') || 1) || 1,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [filters, setFilters] = useState(getFiltersFromParams);

  useEffect(() => {
    setFilters(getFiltersFromParams());
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, String(v)); });
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products || []);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories((data.categories || []).map((c: any) => c.name)))
      .catch(() => setCategories([]));
  }, []);

  const updateFilter = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const hasActiveFilters = !!(
    filters.category ||
    filters.brand ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.rating ||
    filters.search ||
    filters.newArrival ||
    filters.bestSeller ||
    filters.featured
  );

  const clearAll = () =>
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sort: 'newest',
      search: '',
      newArrival: '',
      bestSeller: '',
      featured: '',
      page: 1,
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 md:p-8 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-500 mb-2">Shop</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">
          {filters.category || filters.brand || 'All Products'}
          {filters.search && <span className="font-bold text-indigo-600"> — "{filters.search}"</span>}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Curated beauty picks, trending formulas, and everyday essentials.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 lg:sticky lg:top-24">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="category" value="" checked={!filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="text-indigo-500" />
                  <span className="text-sm">All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="category" value={cat} checked={filters.category === cat} onChange={(e) => updateFilter('category', e.target.value)} className="text-indigo-500" />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Min Rating</h3>
              <div className="space-y-1">
                {[4, 3, 2, 1].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="rating" value={r} checked={Number(filters.rating) === r} onChange={(e) => updateFilter('rating', e.target.value)} />
                    <span className="text-yellow-400 text-sm">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
                    <span className="text-xs text-gray-500">& up</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" value="" checked={!filters.rating} onChange={() => updateFilter('rating', '')} />
                  <span className="text-sm text-gray-500">All ratings</span>
                </label>
              </div>
            </div>

            <button onClick={clearAll} className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-semibold py-2">
              Clear All Filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <p className="text-sm text-gray-500">{pagination?.totalItems || 0} products found</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {filters.category && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">{filters.category}</span>}
              {filters.brand && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">Brand: {filters.brand}</span>}
              {filters.rating && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">{filters.rating}★ & up</span>}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">
                  ₹{filters.minPrice || 0} - ₹{filters.maxPrice || '∞'}
                </span>
              )}
              {filters.search && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">Search: {filters.search}</span>}
              {filters.newArrival && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">New Arrivals</span>}
              {filters.bestSeller && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">Best Sellers</span>}
              {filters.featured && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">Featured</span>}
              <button onClick={clearAll} className="text-xs px-3 py-1 rounded-full border border-slate-200 text-gray-600 hover:bg-slate-50">
                Reset
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-72" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-slate-300 bg-white">
              <div className="text-5xl mb-3">🧴</div>
              <p className="text-gray-600 font-medium">No products found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
              <button onClick={clearAll} className="mt-4 text-sm text-indigo-600 font-semibold hover:text-indigo-700">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters((prev) => ({ ...prev, page: i + 1 }))}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    filters.page === i + 1 ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
