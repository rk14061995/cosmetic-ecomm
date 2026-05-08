'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';

const HERO_GRADIENTS = [
  'from-pink-400 via-rose-300 to-fuchsia-400',
  'from-rose-400 via-pink-300 to-red-300',
  'from-fuchsia-400 via-purple-300 to-pink-400',
];

function SkeletonDetail() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[420px] bg-gray-200 w-full" />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="h-5 bg-gray-200 rounded-full w-24" />
        <div className="h-8 bg-gray-200 rounded-full w-4/5" />
        <div className="h-8 bg-gray-200 rounded-full w-3/5" />
        <div className="flex items-center gap-4 mt-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-full w-28" />
            <div className="h-3 bg-gray-200 rounded-full w-20" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded-full ${i % 4 === 3 ? 'w-3/5' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RelatedProductCard({ product }: { product: any }) {
  return (
    <Link href={`/products/${product._id}`} className="group flex-shrink-0 w-44">
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-200">
        <div className="relative h-44 bg-gray-50 overflow-hidden">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-400"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-3xl">
              💄
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-gray-800 text-xs font-semibold line-clamp-2 leading-snug mb-1">{product.name}</p>
          <p className="text-pink-600 text-sm font-bold">
            {formatPrice(product.discountPrice ?? product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/blog/${slug}`)
      .then(({ data }) => setPost(data.post ?? data))
      .catch(() => router.push('/blog'))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) return <SkeletonDetail />;
  if (!post) return null;

  const heroGradient = HERO_GRADIENTS[Math.floor(Math.random() * HERO_GRADIENTS.length)];
  const hasRelatedProducts = Array.isArray(post.relatedProducts) && post.relatedProducts.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-600 transition-colors font-medium group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Beauty Journal
        </Link>
      </div>

      {/* Hero */}
      <div className="relative mt-6 h-[400px] md:h-[500px] overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${heroGradient}`} />
        )}
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Hero text centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-4 text-center">
          {/* Category badge */}
          <span className="bg-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider shadow-lg">
            {post.category}
          </span>

          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl drop-shadow-lg mb-6">
            {post.title}
          </h1>

          {/* Author + meta row */}
          <div className="flex items-center gap-4 text-white/90">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ring-2 ring-white/40">
              {post.author?.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name ?? ''}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{post.author?.name?.charAt(0)?.toUpperCase() ?? 'G'}</span>
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{post.author?.name ?? 'Glowzy Team'}</p>
              <div className="flex items-center gap-3 text-white/70 text-xs mt-0.5">
                <span>{formatDate(post.createdAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {(post.views ?? 0).toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Tags row */}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-pink-50 text-pink-600 text-xs font-semibold px-3 py-1 rounded-full border border-pink-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Post content */}
        <div
          className="
            leading-relaxed text-gray-600
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-xl  [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
            [&_h4]:text-lg  [&_h4]:font-semibold [&_h4]:text-gray-800 [&_h4]:mt-4 [&_h4]:mb-2
            [&_p]:mb-5 [&_p]:text-base [&_p]:leading-[1.85]
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul>li]:mb-1.5
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol>li]:mb-1.5
            [&_blockquote]:border-l-4 [&_blockquote]:border-pink-400 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-6
            [&_a]:text-pink-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-pink-800
            [&_strong]:font-semibold [&_strong]:text-gray-800
            [&_em]:italic
            [&_hr]:border-pink-100 [&_hr]:my-8
            [&_img]:rounded-2xl [&_img]:my-6 [&_img]:w-full [&_img]:object-cover
            [&_pre]:bg-gray-50 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:mb-5
            [&_code]:bg-pink-50 [&_code]:text-pink-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Divider */}
        <hr className="border-pink-100 my-10" />

        {/* Back link footer */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-pink-600 hover:text-pink-800 font-semibold transition-colors group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Beauty Journal
        </Link>
      </div>

      {/* Related Products — Shop the Story */}
      {hasRelatedProducts && (
        <section className="border-t border-gray-100 bg-gradient-to-br from-pink-50/60 to-rose-50/60 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <p className="text-pink-500 font-semibold text-xs tracking-widest uppercase mb-1">Featured in this post</p>
              <h2 className="text-2xl font-bold text-gray-900">Shop the Story</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {post.relatedProducts.map((product: any) => (
                <RelatedProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
