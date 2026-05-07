'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get(`/payments/logs?page=${page}&limit=20`)
      .then(({ data }) => { setPayments(data.payments || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const STATUS_COLORS: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    created: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
    attempted: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Logs</h1>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Razorpay Order ID</th>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded" /></td></tr>)
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No payment records</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.razorpayOrderId?.slice(-12)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.razorpayPaymentId?.slice(-12) || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{p.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.method || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4">
            {[...Array(Math.ceil(total / 20))].slice(0, 10).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === i + 1 ? 'bg-pink-500 text-white' : 'bg-white border hover:bg-pink-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
