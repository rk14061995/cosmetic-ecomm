'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function CartPage() {
  const dispatch = useDispatch<any>();
  const { items, summary, loading, couponCode } = useSelector((state: any) => state.cart);
  const { user } = useSelector((state: any) => state.auth);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingCoupon, setRemovingCoupon] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [user]);

  const handleQtyChange = (itemId: string, qty: number) => {
    dispatch(updateCartItem({ itemId, quantity: qty } as any));
  };

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    await dispatch(removeFromCart(itemId as any));
    toast.success('Item removed from cart');
    setRemovingId(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    const result = await dispatch(applyCoupon(couponInput.trim() as any));
    if (applyCoupon.fulfilled.match(result)) {
      toast.success(`Coupon applied! You save ${formatPrice(result.payload.discount)}`);
    } else {
      toast.error((result.payload as string) || 'Invalid coupon');
    }
    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = async () => {
    setRemovingCoupon(true);
    try {
      await api.delete('/cart/coupon');
      dispatch(fetchCart());
      setCouponInput('');
      toast.success('Coupon removed');
    } catch { toast.error('Failed to remove coupon'); }
    finally { setRemovingCoupon(false); }
  };

  const freeShippingThreshold = 500;
  const progressPct = Math.min(100, (summary.subtotal / freeShippingThreshold) * 100);

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
          🛒
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your cart</h2>
        <p className="text-gray-500 mb-8">Your saved items are waiting for you</p>
        <Link href="/auth/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
          Sign In →
        </Link>
      </div>
    </div>
  );

  if (loading && items.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12">
      <div className="max-w-6xl mx-auto px-4 animate-pulse">
        <div className="h-9 bg-pink-100 rounded-xl w-56 mb-10" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/80 rounded-3xl shadow-sm" />)}
          </div>
          <div className="h-96 bg-white/80 rounded-3xl shadow-sm" />
        </div>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-inner">
          🛍️
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 text-lg">Discover our premium beauty collection</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/products" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
            Shop Products
          </Link>
          <Link href="/mystery-boxes" className="border-2 border-pink-400 text-pink-600 font-semibold px-8 py-3.5 rounded-full hover:bg-pink-50 transition-all">
            🎁 Mystery Boxes
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-500 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            <Link href="/products" className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              const image = item.product?.images?.[0]?.url || item.mysteryBox?.image || item.image;
              const name = item.product?.name || item.mysteryBox?.name || item.name;
              const price = item.price;
              const isRemoving = removingId === item._id;

              return (
                <div
                  key={item._id}
                  className={`group bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-100 transition-all duration-300 overflow-hidden ${isRemoving ? 'opacity-50 scale-95' : ''}`}
                >
                  <div className="p-5 flex gap-5 items-center">
                    {/* Image */}
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 flex-shrink-0 shadow-sm">
                      {image ? (
                        <Image src={image} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {item.itemType === 'mysteryBox' ? '🎁' : '💄'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className="font-semibold text-gray-900 leading-tight">{name}</p>
                        {item.itemType === 'mysteryBox' && (
                          <span className="flex-shrink-0 text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-200">
                            🎁 Mystery
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-pink-600">{formatPrice(price)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">per item</p>
                    </div>

                    {/* Qty + Total + Remove */}
                    <div className="flex flex-col items-end gap-3">
                      <p className="text-lg font-bold text-gray-900">{formatPrice(price * item.quantity)}</p>

                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => handleQtyChange(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-9 h-9 flex items-center justify-center hover:bg-pink-50 hover:text-pink-600 transition-colors disabled:opacity-30 text-gray-600 font-bold"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(item._id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-pink-50 hover:text-pink-600 transition-colors text-gray-600 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item._id)}
                        disabled={isRemoving}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">

              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Free Shipping Progress */}
              {summary.subtotal < freeShippingThreshold && (
                <div className="mb-6 p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>🚚 Free shipping progress</span>
                    <span className="font-semibold text-pink-600">{formatPrice(freeShippingThreshold - summary.subtotal)} away</span>
                  </div>
                  <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
              {summary.shipping === 0 && summary.subtotal >= freeShippingThreshold && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-2xl text-center text-sm text-green-700 font-semibold">
                  🎉 You've unlocked free shipping!
                </div>
              )}

              {/* Coupon */}
              <div className="mb-6">
                {couponCode ? (
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <div>
                        <p className="text-xs text-gray-500">Coupon applied</p>
                        <p className="font-bold text-green-700 text-sm">{couponCode}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      disabled={removingCoupon}
                      className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      {removingCoupon ? '...' : '✕ Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-gray-50 font-mono placeholder:normal-case placeholder:tracking-normal"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold hover:shadow-md transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="text-gray-700 font-medium">{formatPrice(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? 'text-green-600 font-semibold' : 'text-gray-700 font-medium'}>
                    {summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping)}
                  </span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>− {formatPrice(summary.discount)}</span>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span className="text-pink-600">{formatPrice(summary.total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all text-base"
              >
                Proceed to Checkout
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: '🔒', label: 'Secure\nPayment' },
                  { icon: '↩️', label: '7-Day\nReturns' },
                  { icon: '💯', label: '100%\nAuthentic' },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-1">
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-[10px] text-gray-400 font-medium leading-tight whitespace-pre-line">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
