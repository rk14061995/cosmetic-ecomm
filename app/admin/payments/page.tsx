'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { AdminPageHeader, adminPanel, adminStack, adminTableHead } from '@/components/admin/ui';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  created: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-100 text-slate-600',
  attempted: 'bg-amber-100 text-amber-700',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/payments/logs?page=${page}&limit=20`)
      .then(({ data }) => { setPayments(data.payments || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Payment logs"
        description="Track Razorpay order and payment attempts across the storefront."
      />

      {total > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total records', value: total },
            { label: 'This page', value: payments.length },
            { label: 'Paid', value: payments.filter((p) => p.status === 'paid').length },
            { label: 'Failed', value: payments.filter((p) => p.status === 'failed').length },
          ].map((s) => (
            <div key={s.label} className={`${adminPanel} p-4`}>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className={`${adminPanel} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
                <th className="px-5 py-3">Razorpay Order ID</th>
                <th className="px-5 py-3">Payment ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-4 bg-slate-100 animate-pulse rounded-lg" /></td></tr>)
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400">No payment records found</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{p.razorpayOrderId?.slice(-12) || '—'}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{p.razorpayPaymentId?.slice(-12) || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{p.user?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{p.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatPrice(p.amount)}</td>
                    <td className="px-5 py-4 text-slate-500 capitalize text-sm">{p.method || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-600'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{formatDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Page {page} of {totalPages} · {total} total records</p>
            <div className="flex gap-1">
              {[...Array(Math.min(totalPages, 8))].map((_, i) => (
                <button key={i} type="button" onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${page === i + 1 ? 'bg-indigo-950 text-white shadow-sm' : 'border border-indigo-200/60 bg-white/70 text-indigo-950/70 hover:bg-indigo-50'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
