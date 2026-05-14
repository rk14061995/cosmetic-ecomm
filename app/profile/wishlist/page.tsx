'use client';
import { useAppDispatch } from '@/store/hooks';
import type { Product } from '@/types/api';
import { useEffect } from 'react';
import Link from 'next/link';
import { fetchProfile } from '@/store/slices/authSlice';
import ProductCard from '@/components/products/ProductCard';
import { useRequireUser } from '@/hooks/useRequireUser';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const { user, authReady, isAuthed } = useRequireUser();

  useEffect(() => {
    if (!authReady || !user) return;
    dispatch(fetchProfile());
  }, [authReady, user, dispatch]);

  if (!authReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="h-8 w-8 animate-spin text-pink-500" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthed || !user) return null;

  const wishlist = user.wishlist || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="text-pink-600 hover:text-pink-700">← Profile</Link>
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist ({wishlist.length})</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save products you love by tapping the heart icon</p>
          <Link href="/products" className="bg-pink-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-pink-600">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlist.map((product: Product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
