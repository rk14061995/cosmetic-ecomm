'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  category?: string;
  slug?: string;
}

const CATEGORY_COLOURS: Record<string, string> = {
  Skincare:   'bg-pink-100 text-pink-700',
  Makeup:     'bg-red-100 text-red-700',
  Haircare:   'bg-amber-100 text-amber-700',
  Wellness:   'bg-green-100 text-green-700',
  Tutorial:   'bg-purple-100 text-purple-700',
  Tips:       'bg-blue-100 text-blue-700',
};

function categoryColour(cat?: string) {
  if (!cat) return 'bg-gray-100 text-gray-600';
  return CATEGORY_COLOURS[cat] ?? 'bg-rose-100 text-rose-700';
}

export default function BlogTeaser() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/blog?limit=3&published=true')
      .then(({ data }) => {
        const list: BlogPost[] = Array.isArray(data) ? data : (data.posts ?? data.data ?? []);
        setPosts(list);
      })
      .catch(() => { /* silently skip if endpoint is missing */ })
      .finally(() => setLoaded(true));
  }, []);

  // Don't render until loaded; if empty after loading, render nothing
  if (!loaded || posts.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10">
          <span className="inline-block bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
            Beauty Journal
          </span>
          <h2 className="text-3xl font-bold text-gray-900">From Our Beauty Journal</h2>
          <p className="text-gray-500 mt-2">Tips, tutorials & trends from the Glowzy team</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className="group bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl overflow-hidden border border-pink-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Decorative top bar */}
              <div className="h-1.5 bg-gradient-to-r from-pink-400 to-rose-400" />

              <div className="p-6">
                {/* Category badge */}
                {post.category && (
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${categoryColour(post.category)}`}>
                    {post.category}
                  </span>
                )}

                <h3 className="font-bold text-gray-900 text-base mb-2 leading-snug group-hover:text-pink-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {post.excerpt && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                )}

                <Link
                  href={`/blog/${post.slug || post._id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-rose-600 transition-colors"
                >
                  Read More
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border-2 border-pink-300 text-pink-600 font-semibold px-6 py-2.5 rounded-full hover:bg-pink-50 transition-all text-sm"
          >
            View All Posts →
          </Link>
        </div>
      </div>
    </section>
  );
}
