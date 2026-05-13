'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRequireUser } from '@/hooks/useRequireUser';

const STATUS_STEPS = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered'];

const STATUS_THEME: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Paid: 'bg-blue-50 text-blue-700 border-blue-200',
  Processing: 'bg-violet-50 text-violet-700 border-violet-200',
  Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  Refunded: 'bg-slate-100 text-slate-700 border-slate-200',
};

function StatusBadge({ status }: { status: string }) {
  const theme = STATUS_THEME[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${theme}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
}

function StatusTimeline({ history, currentStatus }: { history: any[]; currentStatus: string }) {
  const isCancelled = currentStatus === 'Cancelled';
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div>
      {isCancelled ? (
        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-2xl border border-rose-100">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <div>
            <p className="font-semibold text-rose-700 text-sm">Order Cancelled</p>
            <p className="text-xs text-rose-500">{history.find((h) => h.status === 'Cancelled')?.note || ''}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className={`flex flex-col items-center gap-1 ${active ? 'scale-110' : ''} transition-transform`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm transition-all
                    ${done
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? '●' : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${done ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-0.5 rounded-full transition-all ${i < currentIdx ? 'bg-slate-700' : 'bg-slate-200'}`} />
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
  const { user, authReady, isAuthed } = useRequireUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !user) {
      if (authReady && !user) setLoading(false);
      return;
    }
    api.get('/orders/my-orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authReady, user]);

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

  const handleViewInvoice = async (orderId: string) => {
    setInvoiceLoadingId(orderId);
    try {
      const { data } = await api.get(`/orders/${orderId}/invoice`);
      if (!data?.invoiceUrl) throw new Error('Missing invoice URL');
      window.open(data.invoiceUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to open invoice');
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-48 mb-8" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-white/80 rounded-3xl shadow-sm" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50">

      {/* Header */}
      <div className="bg-white/85 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Orders</h1>
            <p className="text-slate-500 text-sm">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="w-8 h-8 rounded-2xl bg-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders yet</h2>
            <p className="text-slate-500 mb-8">Explore our collection and place your first order.</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-slate-700 transition-all">
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
                  className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Order ID</p>
                          <p className="font-mono font-bold text-slate-900">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100 hidden sm:block" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Placed On</p>
                          <p className="font-semibold text-slate-700 text-sm">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100 hidden sm:block" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Total</p>
                          <p className="font-bold text-indigo-600 text-lg">{formatPrice(order.totalPrice)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.orderStatus} />
                      </div>
                    </div>

                    {/* Status Timeline */}
                    {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Refunded' && (
                      <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <StatusTimeline history={order.statusHistory} currentStatus={order.orderStatus} />
                      </div>
                    )}

                    {/* Items preview */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {order.orderItems.slice(0, 3).map((item: any, i: number) => (
                          <span key={i} className="text-sm text-slate-600">
                            {item.name}
                            <span className="text-slate-400"> ×{item.quantity}</span>
                            {i < Math.min(order.orderItems.length, 3) - 1 && <span className="text-slate-300 ml-3">·</span>}
                          </span>
                        ))}
                        {order.orderItems.length > 3 && (
                          <span className="text-sm text-indigo-600 font-medium">+{order.orderItems.length - 3} more</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {order.isPaid && (
                          <button
                            onClick={() => handleViewInvoice(order._id)}
                            disabled={invoiceLoadingId === order._id}
                            className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-all disabled:opacity-60"
                          >
                            {invoiceLoadingId === order._id ? 'Opening…' : 'Invoice'}
                          </button>
                        )}
                        {['Pending', 'Paid'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            disabled={isCancelling}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                          className="text-xs text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-1.5 rounded-full transition-all flex items-center gap-1"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70">
                      <div className="p-6 grid md:grid-cols-2 gap-8">

                        {/* Items & Price Breakdown */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Items & Pricing</h4>
                          <div className="space-y-3">
                            {order.orderItems.map((item: any) => (
                              <div key={item._id} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                    {item.quantity}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                    <p className="text-xs text-slate-400">×{item.quantity} @ {formatPrice(item.price)}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-slate-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Price summary */}
                          <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                              <span>Subtotal</span>
                              <span>{formatPrice(order.itemsPrice)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                              <span>Shipping</span>
                              <span className={order.shippingPrice === 0 ? 'text-emerald-600 font-semibold' : ''}>
                                {order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}
                              </span>
                            </div>
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                                <span>Discount {order.couponCode && <span className="text-xs font-mono bg-emerald-100 px-1.5 py-0.5 rounded-md ml-1">{order.couponCode}</span>}</span>
                                <span>− {formatPrice(order.discountAmount)}</span>
                              </div>
                            )}
                            {order.walletAmountUsed > 0 && (
                              <div className="flex justify-between text-sm text-blue-600 font-medium">
                                <span>Wallet Used</span>
                                <span>− {formatPrice(order.walletAmountUsed)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                              <span>Total Paid</span>
                              <span className="text-indigo-600">{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Address + Status History */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Delivery Address</h4>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-sm text-slate-600 space-y-1">
                              <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
                              <p>{order.shippingAddress?.addressLine1}</p>
                              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
                              <p className="text-slate-400">{order.shippingAddress?.phone}</p>
                            </div>
                          </div>

                          {order.trackingNumber && (
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tracking Number</h4>
                              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 font-mono font-bold text-indigo-700 text-sm">
                                {order.trackingNumber}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Status History</h4>
                            <div className="space-y-2">
                              {order.statusHistory?.map((h: any, i: number) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 bg-slate-900 text-white">
                                    ●
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-slate-800">{h.status}</p>
                                      <p className="text-xs text-slate-400 flex-shrink-0">{formatDate(h.timestamp)}</p>
                                    </div>
                                    {h.note && <p className="text-xs text-slate-400 mt-0.5">{h.note}</p>}
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
