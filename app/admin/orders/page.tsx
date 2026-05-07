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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateModal, setUpdateModal] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', note: '' });

  const fetchOrders = () => {
    const params = filterStatus ? `?status=${filterStatus}` : '';
    api.get(`/orders${params}`)
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders Management</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!filterStatus ? 'bg-pink-500 text-white' : 'bg-white border hover:bg-pink-50'}`}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterStatus === s ? 'bg-pink-500 text-white' : 'bg-white border hover:bg-pink-50'}`}>
            {s}
          </button>
        ))}
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
                      <button onClick={() => openUpdateModal(order)}
                        className="text-xs bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full hover:bg-pink-200 transition-colors font-medium">
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

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 mb-4">Update Order #{updateModal._id.slice(-8).toUpperCase()}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {updateForm.status === 'Shipped' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input type="text" value={updateForm.trackingNumber}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                    placeholder="Enter tracking number"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <input type="text" value={updateForm.note}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Internal note"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateStatus} disabled={!!updatingId}
                className="flex-1 bg-pink-500 text-white font-semibold py-2.5 rounded-full hover:bg-pink-600 disabled:opacity-50">
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
    </div>
  );
}
