'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Haircare', 'Wellness', 'Tutorials', 'News'];

const COVER_GRADIENTS = [
  'from-pink-300 via-rose-200 to-fuchsia-300',
  'from-rose-300 via-pink-200 to-red-200',
  'from-fuchsia-300 via-purple-200 to-pink-300',
  'from-pink-200 via-rose-300 to-pink-400',
  'from-red-200 via-rose-200 to-fuchsia-200',
  'from-purple-200 via-pink-200 to-rose-300',
];

function SkeletonCard() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-200 rounded-full w-4/5" />
        <div className="h-5 bg-gray-200 rounded-full w-3/5" />
        <div className="h-4 bg-gray-200 rounded-full w-full" />
        <div className="h-4 bg-gray-200 rounded-full w-5/6" />
        <div className="h-4 bg-gray-200 rounded-full w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 bg-gray-200 rounded-full w-28" />
          <div className="h-3 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: any; index: number }) {
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length];

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
        {/* Cover image */}
        <div className="relative h-52 overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-5xl opacity-60 select-none">
                {post.category === 'Skincare' ? '✨' :
                 post.category === 'Makeup' ? '💄' :
                 post.category === 'Haircare' ? '💇' :
                 post.category === 'Wellness' ? '🌿' :
                 post.category === 'Tutorials' ? '🎬' :
                 post.category === 'News' ? '📰' : '🌸'}
              </span>
            </div>
          )}
          {/* Glassmorphism overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
          {/* Category badge */}
          <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
            {post.category}
          </span>
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-1">
          <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
            {post.excerpt}
          </p>

          {/* Author + meta */}
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {post.author?.name?.charAt(0)?.toUpperCase() ?? 'G'}
              </div>
              <span className="font-medium text-gray-600 truncate max-w-[90px]">
                {post.author?.name ?? 'GlowBox Team'}
              </span>
              <span className="text-gray-300">·</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{(post.views ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Read more */}
          <div className="mt-3">
            <span className="text-pink-500 text-sm font-semibold group-hover:text-pink-700 transition-colors">
              Read More →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (category: string, pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: '9', page: String(pageNum) });
      if (category !== 'All') params.set('category', category);
      const { data } = await api.get(`/blog?${params}`);
      const incoming: any[] = data.posts ?? data ?? [];
      setPosts((prev) => append ? [...prev, ...incoming] : incoming);
      // Support both pagination shapes the API might return
      const total: number = data.pagination?.totalItems ?? data.total ?? incoming.length;
      setHasMore(pageNum * 9 < total);
    } catch {
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Reset + fetch on category change
  useEffect(() => {
    setPage(1);
    fetchPosts(activeCategory, 1, false);
  }, [activeCategory, fetchPosts]);

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(activeCategory, next, true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <section className="bg-gradient-to-br from-pink-50 to-rose-50 py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-pink-400 font-semibold text-sm tracking-widest uppercase mb-3">GlowBox Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Beauty Journal
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Tips, tutorials &amp; trends from our beauty experts
          </p>
        </div>
      </section>

      {/* Category filter tabs */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                    : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center text-4xl mb-5">🌸</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-400">Check back soon — our beauty experts are writing!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <PostCard key={post._id ?? post.slug ?? i} post={post} index={i} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-10 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:scale-100"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : 'Load More Posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
