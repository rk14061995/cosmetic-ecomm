'use client';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { fetchProfile } from '@/store/slices/authSlice';
import ProductCard from '@/components/products/ProductCard';

export default function WishlistPage() {
  const { user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<any>();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    dispatch(fetchProfile());
  }, []);

  if (!user) return null;
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
          {wishlist.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
