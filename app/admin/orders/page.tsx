'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { formatOrderLabelForDisplay } from '@/lib/orderDisplay';
import toast from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminModal,
  adminPanel,
  adminStack,
  adminTableHead,
  adminInput,
  adminLabel,
  btnPrimary,
  btnSecondary,
  btnSuccess,
  filterPill,
} from '@/components/admin/ui';
import type { Order, Pagination, OrderItem, ApiError } from '@/types/api';

const STATUSES = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateModal, setUpdateModal] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', note: '' });

  const fetchOrders = () => {
    const q = new URLSearchParams();
    if (filterStatus) q.set('status', filterStatus);
    if (paymentFilter) q.set('paymentMethod', paymentFilter);
    if (search.trim()) q.set('search', search.trim());
    q.set('page', String(page));
    q.set('limit', '20');
    api.get(`/orders?${q.toString()}`)
      .then(({ data }) => { setOrders(data.orders || []); setPagination(data.pagination || null); })
      .catch((err) => { toast.error((err as ApiError).response?.data?.message || 'Failed to load orders'); setOrders([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filterStatus, paymentFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openUpdateModal = (order: Order) => {
    setUpdateModal(order);
    setUpdateForm({ status: order.orderStatus, trackingNumber: order.trackingNumber || '', note: '' });
  };

  const handleUpdateStatus = async () => {
    if (!updateModal) return;
    setUpdatingId(updateModal._id);
    try {
      await api.put(`/orders/${encodeURIComponent(updateModal.orderNumber || updateModal._id)}/status`, updateForm);
      toast.success('Order status updated');
      setUpdateModal(null);
      fetchOrders();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to update');
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

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Orders"
        description="Search, filter, and update fulfillment status. Customer-facing order references are shown when available."
        actions={
          <button type="button" onClick={handleExport} className={btnSuccess}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        }
      />

      <div className={`${adminPanel} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setFilterStatus(''); setPage(1); }} className={filterPill(!filterStatus)}>
            All
          </button>
          {STATUSES.map((s) => (
            <button key={s} type="button" onClick={() => { setFilterStatus(s); setPage(1); }} className={filterPill(filterStatus === s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Order #, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${adminInput} max-w-xs min-w-[12rem]`}
            />
            <button type="submit" className={btnPrimary}>
              Search
            </button>
          </form>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className={`${adminInput} w-auto min-w-[10rem]`}
          >
            <option value="">All payments</option>
            <option value="razorpay">Razorpay</option>
            <option value="cod">COD</option>
          </select>
        </div>
      </div>

      <div className={`${adminPanel} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
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
                  <tr key={order._id} className="transition-colors hover:bg-slate-50/90">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-slate-800">{formatOrderLabelForDisplay(order)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate max-w-[140px]" title={order._id}>{order._id}</p>
                    </td>
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
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className={`${btnSecondary} px-3 py-1.5 text-xs`}
                        >
                          View
                        </button>
                        <button type="button" onClick={() => openUpdateModal(order)} className={`${btnPrimary} px-3 py-1.5 text-xs`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <AdminModal className="max-w-md">
            <h3 className="text-lg font-semibold text-slate-900">Update order</h3>
            <p className="mt-1 font-mono text-sm text-slate-500">{formatOrderLabelForDisplay(updateModal)}</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className={adminLabel}>Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))}
                  className={adminInput}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {updateForm.status === 'Shipped' && (
                <div>
                  <label className={adminLabel}>Tracking number</label>
                  <input
                    type="text"
                    value={updateForm.trackingNumber}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                    placeholder="Carrier tracking ID"
                    className={adminInput}
                  />
                </div>
              )}
              <div>
                <label className={adminLabel}>Internal note (optional)</label>
                <input
                  type="text"
                  value={updateForm.note}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Visible in status history"
                  className={adminInput}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleUpdateStatus} disabled={!!updatingId} className={`${btnPrimary} flex-1`}>
                {updatingId ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setUpdateModal(null)} className={`${btnSecondary} flex-1`}>
                Cancel
              </button>
            </div>
          </AdminModal>
        </div>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <AdminModal className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Order Details</h3>
                <p className="text-sm font-mono text-slate-500">{formatOrderLabelForDisplay(detailOrder)}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1 break-all">{detailOrder._id}</p>
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
                {(detailOrder.orderItems || []).map((item: OrderItem, i: number) => (
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
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="mb-1 text-xs text-slate-500">Payment</p>
                <p className="font-semibold text-slate-900">{detailOrder.paymentMethod?.toUpperCase()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
                <p className="mb-1 text-xs text-slate-400">Total</p>
                <p className="text-lg font-semibold tabular-nums">{formatPrice(detailOrder.totalPrice || 0)}</p>
              </div>
            </div>
          </AdminModal>
        </div>
      )}
    </div>
  );
}
