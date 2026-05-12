'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();

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

  const heading =
    filters.category || filters.brand || (filters.search ? 'Search results' : 'All products');

  const subtitle = filters.search
    ? `Matches for “${filters.search}”. Use the sidebar to narrow by category, price, or rating.`
    : filters.category
      ? `You’re browsing ${filters.category}. Combine filters to find exactly what your routine needs.`
      : filters.brand
        ? `Products from ${filters.brand}.`
        : 'Curated beauty picks, trending formulas, and everyday essentials — all in one place.';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-indigo-200/50 bg-white mb-8 shadow-[0_24px_64px_-28px_rgba(67,56,202,0.35)]">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-300/45 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/95 via-white to-cyan-50/90"
          aria-hidden
        />
        <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
          <nav className="mb-5 text-xs text-gray-500" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="font-medium text-gray-500 transition-colors hover:text-indigo-600">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-gray-300">
                /
              </li>
              <li className="font-semibold text-gray-800">Products</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 shadow-sm">
                Shop
              </span>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl lg:leading-[1.08] capitalize">
                {heading}
              </h1>
              {filters.search && (
                <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-500">Query</span>
                  <span className="rounded-lg bg-indigo-600 px-2.5 py-1 font-semibold text-white shadow-sm">
                    &ldquo;{filters.search}&rdquo;
                  </span>
                </p>
              )}
              <p className="mt-4 text-base leading-relaxed text-gray-600">{subtitle}</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 text-sm font-semibold text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-800 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-3 sm:flex-nowrap lg:flex-col lg:items-stretch">
              <div className="min-w-[11rem] rounded-2xl border border-indigo-100/90 bg-white/95 px-5 py-4 shadow-sm backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">In this view</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-gray-900">
                  {loading ? <span className="text-gray-300">…</span> : pagination?.totalItems ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">products match your filters</p>
              </div>
              <div className="flex min-w-[11rem] flex-col justify-center rounded-2xl border border-cyan-100/90 bg-gradient-to-br from-cyan-50/80 to-white px-5 py-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-700">Free delivery</p>
                <p className="text-[11px] text-gray-500">On orders above ₹500</p>
              </div>
            </div>
          </div>
        </div>
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
