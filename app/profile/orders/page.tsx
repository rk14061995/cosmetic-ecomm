'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered'];

const STATUS_ICON: Record<string, string> = {
  Pending: '🕐', Paid: '💳', Processing: '⚙️',
  Shipped: '🚚', Delivered: '✅', Cancelled: '✕', Refunded: '↩️',
};

const STATUS_GRADIENT: Record<string, string> = {
  Pending:    'from-yellow-400 to-amber-400',
  Paid:       'from-blue-400 to-cyan-400',
  Processing: 'from-purple-400 to-violet-400',
  Shipped:    'from-indigo-400 to-blue-500',
  Delivered:  'from-green-400 to-emerald-500',
  Cancelled:  'from-red-400 to-rose-500',
  Refunded:   'from-gray-400 to-slate-400',
};

function StatusBadge({ status }: { status: string }) {
  const gradient = STATUS_GRADIENT[status] || 'from-gray-400 to-slate-400';
  const icon = STATUS_ICON[status] || '•';
  return (
    <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm`}>
      <span>{icon}</span> {status}
    </span>
  );
}

function StatusTimeline({ history, currentStatus }: { history: any[]; currentStatus: string }) {
  const isCancelled = currentStatus === 'Cancelled';
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div>
      {isCancelled ? (
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl border border-red-100">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">Order Cancelled</p>
            <p className="text-xs text-red-400">{history.find((h) => h.status === 'Cancelled')?.note || ''}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center gap-1 ${active ? 'scale-110' : ''} transition-transform`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all
                    ${done
                      ? `bg-gradient-to-br ${STATUS_GRADIENT[step] || 'from-pink-400 to-rose-400'} text-white`
                      : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {done ? (active ? STATUS_ICON[step] : '✓') : i + 1}
                  </div>
                  <span className={`text-[9px] font-medium whitespace-nowrap ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-0.5 rounded-full transition-all ${i < currentIdx ? 'bg-gradient-to-r from-pink-300 to-rose-300' : 'bg-gray-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    api.get('/orders/my-orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.put(`/orders/${orderId}/cancel`, { reason: 'Cancelled by user' });
      setOrders((prev) => prev.map((o) =>
        o._id === orderId ? { ...o, orderStatus: 'Cancelled', statusHistory: [...(o.statusHistory || []), { status: 'Cancelled', timestamp: new Date(), note: 'Cancelled by user' }] } : o
      ));
      toast.success('Order cancelled successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-4 animate-pulse">
        <div className="h-8 bg-pink-100 rounded-xl w-48 mb-8" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-white/80 rounded-3xl shadow-sm" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500 text-sm">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-28 h-28 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-inner">
              📦
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-8">Explore our premium collection and place your first order</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              const isCancelling = cancellingId === order._id;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-100 transition-all duration-300 overflow-hidden"
                >
                  {/* Status color bar */}
                  <div className={`h-1 bg-gradient-to-r ${STATUS_GRADIENT[order.orderStatus] || 'from-gray-300 to-gray-300'}`} />

                  {/* Order Header */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Order ID</p>
                          <p className="font-mono font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Placed On</p>
                          <p className="font-semibold text-gray-700 text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Total</p>
                          <p className="font-bold text-pink-600 text-lg">{formatPrice(order.totalPrice)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.orderStatus} />
                      </div>
                    </div>

                    {/* Status Timeline */}
                    {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Refunded' && (
                      <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-2xl border border-gray-100">
                        <StatusTimeline history={order.statusHistory} currentStatus={order.orderStatus} />
                      </div>
                    )}

                    {/* Items preview */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {order.orderItems.slice(0, 3).map((item: any, i: number) => (
                          <span key={i} className="text-sm text-gray-500">
                            {item.isMysteryBox ? '🎁 ' : ''}{item.name}
                            <span className="text-gray-400"> ×{item.quantity}</span>
                            {i < Math.min(order.orderItems.length, 3) - 1 && <span className="text-gray-300 ml-3">·</span>}
                          </span>
                        ))}
                        {order.orderItems.length > 3 && (
                          <span className="text-sm text-pink-500 font-medium">+{order.orderItems.length - 3} more</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {['Pending', 'Paid'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            disabled={isCancelling}
                            className="text-xs text-red-500 hover:text-red-600 font-semibold border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                          className="text-xs text-pink-600 hover:text-pink-700 font-semibold border border-pink-200 hover:border-pink-300 hover:bg-pink-50 px-4 py-1.5 rounded-full transition-all flex items-center gap-1"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-pink-50/30">
                      <div className="p-6 grid md:grid-cols-2 gap-8">

                        {/* Items & Price Breakdown */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Items & Pricing</h4>
                          <div className="space-y-3">
                            {order.orderItems.map((item: any) => (
                              <div key={item._id} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-sm flex-shrink-0">
                                    {item.isMysteryBox ? '🎁' : '💄'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-400">×{item.quantity} @ {formatPrice(item.price)}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Price summary */}
                          <div className="mt-5 pt-4 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Subtotal</span>
                              <span>{formatPrice(order.itemsPrice)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Shipping</span>
                              <span className={order.shippingPrice === 0 ? 'text-green-600 font-semibold' : ''}>
                                {order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}
                              </span>
                            </div>
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Discount {order.couponCode && <span className="text-xs font-mono bg-green-100 px-1.5 py-0.5 rounded-md ml-1">{order.couponCode}</span>}</span>
                                <span>− {formatPrice(order.discountAmount)}</span>
                              </div>
                            )}
                            {order.walletAmountUsed > 0 && (
                              <div className="flex justify-between text-sm text-blue-600 font-medium">
                                <span>Wallet Used</span>
                                <span>− {formatPrice(order.walletAmountUsed)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                              <span>Total Paid</span>
                              <span className="text-pink-600">{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Address + Status History */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Delivery Address</h4>
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-sm text-gray-600 space-y-1">
                              <p className="font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
                              <p>{order.shippingAddress?.addressLine1}</p>
                              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
                              <p className="text-gray-400 flex items-center gap-1">📞 {order.shippingAddress?.phone}</p>
                            </div>
                          </div>

                          {order.trackingNumber && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tracking Number</h4>
                              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 font-mono font-bold text-indigo-700 text-sm flex items-center gap-2">
                                🚚 {order.trackingNumber}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status History</h4>
                            <div className="space-y-2">
                              {order.statusHistory?.map((h: any, i: number) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 bg-gradient-to-br ${STATUS_GRADIENT[h.status] || 'from-gray-300 to-gray-300'} text-white`}>
                                    {STATUS_ICON[h.status] || '•'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-gray-800">{h.status}</p>
                                      <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(h.timestamp)}</p>
                                    </div>
                                    {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
