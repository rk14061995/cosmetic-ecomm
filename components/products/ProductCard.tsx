'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import type { Product } from '@/types/api';

export default function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, authReady } = useAuthStatus();
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authReady) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const result = await dispatch(addToCart({ itemId: product._id, itemType: 'product', quantity: 1 }));
    if (addToCart.fulfilled.match(result)) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.payload as string || 'Failed to add to cart');
    }
  };

  return (
    <Link href={`/products/${product._id || product.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all border border-slate-200">
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">💄</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-indigo-500 font-semibold mb-1">{product.brand}</p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-yellow-400 text-xs">
            {'★'.repeat(Math.round(product.ratings || 0))}
            {'☆'.repeat(5 - Math.round(product.ratings || 0))}
          </div>
          <span className="text-xs text-gray-400">({product.numReviews || 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900">{formatPrice(product.discountPrice || product.price)}</span>
            {product.discountPrice && (
              <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(product.price)}</span>
            )}
          </div>
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
