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
      .then(({ data }) => {
        setOrders(data.orders || []);
        setPagination(data.pagination || null);
      })
      .catch((err: any) => {
        toast.error(err.response?.data?.message || 'Failed to load admin orders');
        setOrders([]);
      })
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
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleExport = async () => {
    const q = new URLSearchParams();
    if (filterStatus) q.set('status', filterStatus);
    if (paymentFilter) q.set('paymentMethod', paymentFilter);
    const res = await api.get(`/orders/export/csv?${q.toString()}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders Management</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filterStatus ? 'bg-indigo-500 text-white' : 'bg-white border hover:bg-indigo-50'}`}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === s ? 'bg-indigo-500 text-white' : 'bg-white border hover:bg-indigo-50'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by order id/email/phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          />
          <button type="submit" className="px-3 py-2 rounded-xl text-sm bg-gray-900 text-white">Search</button>
        </form>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="border rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All Payments</option>
          <option value="razorpay">Razorpay</option>
          <option value="cod">COD</option>
        </select>
        <button onClick={handleExport} className="px-3 py-2 rounded-xl text-sm bg-emerald-600 text-white">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{order.orderItems?.length} item(s)</td>
                    <td className="px-4 py-3 font-bold">{formatPrice(order.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.paymentMethod === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.paymentMethod?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getOrderStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailOrder(order)}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors font-medium mr-2">
                        View
                      </button>
                      <button onClick={() => openUpdateModal(order)}
                        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-200 transition-colors font-medium">
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pagination && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 mb-4">Update Order #{updateModal._id.slice(-8).toUpperCase()}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {updateForm.status === 'Shipped' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input type="text" value={updateForm.trackingNumber}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                    placeholder="Enter tracking number"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <input type="text" value={updateForm.note}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Internal note"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateStatus} disabled={!!updatingId}
                className="flex-1 bg-indigo-500 text-white font-semibold py-2.5 rounded-full hover:bg-indigo-600 disabled:opacity-50">
                {updatingId ? 'Updating...' : 'Update Status'}
              </button>
              <button onClick={() => setUpdateModal(null)}
                className="flex-1 border font-semibold py-2.5 rounded-full hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Order #{detailOrder._id.slice(-8).toUpperCase()}</h3>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setDetailOrder(null)}>Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Customer</p>
                <p className="text-sm font-medium text-gray-900">{detailOrder.user?.name || '—'}</p>
                <p className="text-sm text-gray-500">{detailOrder.user?.email || '—'}</p>
                <p className="text-sm text-gray-500">{detailOrder.shippingAddress?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Shipping Address</p>
                <p className="text-sm text-gray-700">{detailOrder.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-700">{detailOrder.shippingAddress?.addressLine1}</p>
                {detailOrder.shippingAddress?.addressLine2 && <p className="text-sm text-gray-700">{detailOrder.shippingAddress?.addressLine2}</p>}
                <p className="text-sm text-gray-700">{detailOrder.shippingAddress?.city}, {detailOrder.shippingAddress?.state} - {detailOrder.shippingAddress?.pincode}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Items</p>
              <div className="space-y-2">
                {(detailOrder.orderItems || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-500">Payment</p>
                <p className="font-semibold text-gray-900">{detailOrder.paymentMethod?.toUpperCase()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-gray-900">{formatPrice(detailOrder.totalPrice || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
