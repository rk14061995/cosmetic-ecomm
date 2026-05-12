'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUSES = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateModal, setUpdateModal] = useState<any>(null);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', note: '' });

  const fetchOrders = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (filterStatus) q.set('status', filterStatus);
    if (paymentFilter) q.set('paymentMethod', paymentFilter);
    if (search.trim()) q.set('search', search.trim());
    q.set('page', String(page));
    q.set('limit', '20');
    api.get(`/orders?${q.toString()}`)
      .then(({ data }) => { setOrders(data.orders || []); setPagination(data.pagination || null); })
      .catch((err: any) => { toast.error(err.response?.data?.message || 'Failed to load orders'); setOrders([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filterStatus, paymentFilter, page]);

  const openUpdateModal = (order: any) => {
    setUpdateModal(order);
    setUpdateForm({ status: order.orderStatus, trackingNumber: order.trackingNumber || '', note: '' });
  };

  const handleUpdateStatus = async () => {
    if (!updateModal) return;
    setUpdatingId(updateModal._id);
    try {
      await api.put(`/orders/${updateModal._id}/status`, updateForm);
      toast.success('Order status updated');
      setUpdateModal(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setUpdatingId(null); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchOrders(); };

  const handleExport = async () => {
    const q = new URLSearchParams();
    if (filterStatus) q.set('status', filterStatus);
    if (paymentFilter) q.set('paymentMethod', paymentFilter);
    const res = await api.get(`/orders/export/csv?${q.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `orders-${Date.now()}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  };

  const inputCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and update all customer orders</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setFilterStatus(''); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!filterStatus ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input type="text" placeholder="Search order / email / phone" value={search}
              onChange={(e) => setSearch(e.target.value)} className={inputCls + ' w-64'} />
            <button type="submit" className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors">Search</button>
          </form>
          <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">All Payments</option>
            <option value="razorpay">Razorpay</option>
            <option value="cod">COD</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-5 py-3">
                    <div className="h-4 bg-slate-100 animate-pulse rounded-lg" />
                  </td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-slate-400">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{order.user?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{order.orderItems?.length} item(s)</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatPrice(order.totalPrice)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${order.paymentMethod === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.paymentMethod?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getOrderStatusColor(order.orderStatus)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setDetailOrder(order)}
                          className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                          View
                        </button>
                        <button onClick={() => openUpdateModal(order)}
                          className="text-xs bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-200 transition-colors font-medium">
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Page {pagination.currentPage} of {pagination.totalPages || 1}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage}
                className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage}
                className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Update Order</h3>
            <p className="text-sm text-slate-500 mb-6 font-mono">#{updateModal._id.slice(-8).toUpperCase()}</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Status</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))} className={inputCls + ' w-full'}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {updateForm.status === 'Shipped' && (
                <div>
                  <label className={labelCls}>Tracking Number</label>
                  <input type="text" value={updateForm.trackingNumber}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                    placeholder="Enter tracking number" className={inputCls + ' w-full'} />
                </div>
              )}
              <div>
                <label className={labelCls}>Internal Note (optional)</label>
                <input type="text" value={updateForm.note}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Note for your team" className={inputCls + ' w-full'} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateStatus} disabled={!!updatingId}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                {updatingId ? 'Updating…' : 'Update Status'}
              </button>
              <button onClick={() => setUpdateModal(null)}
                className="flex-1 border border-slate-200 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Order Details</h3>
                <p className="text-sm font-mono text-slate-500">#{detailOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setDetailOrder(null)}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-400 font-semibold mb-3 tracking-wide">Customer</p>
                <p className="font-semibold text-slate-800">{detailOrder.user?.name || '—'}</p>
                <p className="text-sm text-slate-500">{detailOrder.user?.email || '—'}</p>
                <p className="text-sm text-slate-500">{detailOrder.shippingAddress?.phone || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-400 font-semibold mb-3 tracking-wide">Shipping Address</p>
                <p className="font-semibold text-slate-800">{detailOrder.shippingAddress?.fullName}</p>
                <p className="text-sm text-slate-500">{detailOrder.shippingAddress?.addressLine1}</p>
                {detailOrder.shippingAddress?.addressLine2 && <p className="text-sm text-slate-500">{detailOrder.shippingAddress.addressLine2}</p>}
                <p className="text-sm text-slate-500">{detailOrder.shippingAddress?.city}, {detailOrder.shippingAddress?.state} — {detailOrder.shippingAddress?.pincode}</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs uppercase text-slate-400 font-semibold mb-3 tracking-wide">Items</p>
              <div className="space-y-2">
                {(detailOrder.orderItems || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Payment Method</p>
                <p className="font-bold text-slate-900">{detailOrder.paymentMethod?.toUpperCase()}</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">Total</p>
                <p className="font-bold text-violet-700 text-lg">{formatPrice(detailOrder.totalPrice || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
