'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const FREE_SHIPPING_THRESHOLD = 500;

export default function CartPage() {
  const dispatch = useDispatch<any>();
  const { items, summary, loading, couponCode } = useSelector((state: any) => state.cart);
  const { user } = useSelector((state: any) => state.auth);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingCoupon, setRemovingCoupon] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => { if (user) dispatch(fetchCart()); }, [user]);

  const handleQtyChange = (itemId: string, qty: number) => dispatch(updateCartItem({ itemId, quantity: qty } as any));

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    await dispatch(removeFromCart(itemId as any));
    toast.success('Removed from cart');
    setRemovingId(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    const result = await dispatch(applyCoupon(couponInput.trim() as any));
    if (applyCoupon.fulfilled.match(result)) toast.success(`Coupon applied! You save ${formatPrice(result.payload.discount)}`);
    else toast.error((result.payload as string) || 'Invalid coupon');
    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = async () => {
    setRemovingCoupon(true);
    try { await api.delete('/cart/coupon'); dispatch(fetchCart()); setCouponInput(''); toast.success('Coupon removed'); }
    catch { toast.error('Failed to remove coupon'); }
    finally { setRemovingCoupon(false); }
  };

  const progressPct = Math.min(100, ((summary.subtotal || 0) / FREE_SHIPPING_THRESHOLD) * 100);

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <svg className="w-9 h-9 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your cart</h2>
        <p className="text-gray-500 text-sm mb-8">Your saved items will be waiting for you</p>
        <Link href="/auth/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:scale-[1.02] transition-all">
          Sign In
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </div>
    </div>
  );

  if (loading && items.length === 0) return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-52 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm" />)}
          </div>
          <div className="h-96 bg-white rounded-2xl shadow-sm" />
        </div>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <svg className="w-12 h-12 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Explore our premium beauty collection</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/products" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:scale-[1.02] transition-all text-sm">
            Shop Products
          </Link>
          <Link href="/mystery-boxes" className="border-2 border-pink-300 text-pink-600 font-semibold px-7 py-3 rounded-full hover:bg-pink-50 transition-all text-sm">
            Mystery Boxes
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <Link href="/products" className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item: any) => {
              const image = item.product?.images?.[0]?.url || item.mysteryBox?.image || item.image;
              const name = item.product?.name || item.mysteryBox?.name || item.name;
              const isRemoving = removingId === item._id;

              return (
                <div key={item._id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center transition-all duration-200 ${isRemoving ? 'opacity-40 scale-[0.98]' : 'hover:shadow-md'}`}>
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {image ? (
                      <Image src={image} alt={name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{name}</p>
                        {item.itemType === 'mysteryBox' && (
                          <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Mystery Box</span>
                        )}
                      </div>
                      <button onClick={() => handleRemove(item._id)} disabled={isRemoving}
                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <button onClick={() => handleQtyChange(item._id, item.quantity - 1)} disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-pink-50 hover:text-pink-600 disabled:opacity-30 transition-colors text-lg font-light">
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-colors text-lg font-light">
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400">{formatPrice(item.price)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20">

              {/* Free shipping tracker */}
              {summary.subtotal < FREE_SHIPPING_THRESHOLD ? (
                <div className="mb-5 p-3.5 bg-pink-50 rounded-xl border border-pink-100">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-600 font-medium">Free shipping progress</span>
                    <span className="font-bold text-pink-600">{formatPrice(FREE_SHIPPING_THRESHOLD - summary.subtotal)} to go</span>
                  </div>
                  <div className="h-1.5 bg-pink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              ) : (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-sm text-emerald-700 font-semibold">
                  Free shipping unlocked!
                </div>
              )}

              {/* Coupon */}
              <div className="mb-5">
                {couponCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">Coupon applied</p>
                        <p className="font-bold text-emerald-700 text-sm font-mono">{couponCode}</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} disabled={removingCoupon}
                      className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                      {removingCoupon ? '…' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Coupon code"
                      className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans bg-gray-50" />
                    <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()}
                      className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 whitespace-nowrap">
                      {applyingCoupon ? '…' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-gray-800">{formatPrice(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? 'text-emerald-600 font-semibold' : 'font-medium text-gray-800'}>
                    {summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping)}
                  </span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>−{formatPrice(summary.discount)}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-200 pt-2.5 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-xl text-pink-600">{formatPrice(summary.total)}</span>
                </div>
              </div>

              {/* CTA */}
              <Link href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all text-sm">
                Checkout
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>

              {/* Trust badges */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-center">
                {[
                  { icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z', label: 'Secure\nPayment' },
                  { icon: 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3', label: '7-Day\nReturns' },
                  { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '100%\nAuthentic' },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium leading-tight text-center whitespace-pre-line">{b.label}</span>
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
