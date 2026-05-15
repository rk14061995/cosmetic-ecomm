'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AdminPageHeader, adminPanel, adminStack, adminInput, adminLabel,
  adminTableHead, btnPrimary, btnSecondary,
} from '@/components/admin/ui';
import type { Refund, ApiError } from '@/types/api';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'processed';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'processed', label: 'Processed' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  approved:  'bg-indigo-100 text-indigo-700',
  processed: 'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};

const METHOD_LABELS: Record<string, string> = {
  wallet: 'Wallet credit', bank: 'Bank transfer', razorpay: 'Razorpay', other: 'Other',
};

const EMPTY_FORM = { orderId: '', amount: '', reason: '', method: 'wallet', adminNote: '' };

export default function RefundsPage() {
  const [refunds, setRefunds]       = useState<Refund[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [actionModal, setActionModal] = useState<{ refund: Refund; note: string } | null>(null);

  const fetch = (s: StatusFilter) => {
    setLoading(true);
    const params = s !== 'all' ? `?status=${s}` : '';
    api.get(`/refunds${params}`)
      .then(({ data }) => setRefunds(data.refunds))
      .catch((err: unknown) => toast.error((err as ApiError).response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(statusFilter); }, [statusFilter]);

  const handleCreate = async () => {
    if (!form.orderId.trim() || !form.amount || !form.reason.trim()) {
      toast.error('Order ID, amount, and reason are required'); return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/refunds', { ...form, amount: Number(form.amount) });
      setRefunds(prev => [data.refund, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Refund created');
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to create refund');
    } finally { setSaving(false); }
  };

  const handleStatus = async (id: string, status: string, note: string) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/refunds/${id}/status`, { status, adminNote: note });
      setRefunds(prev => prev.map(r => r._id === id ? data.refund : r));
      setActionModal(null);
      toast.success(`Refund marked as ${status}`);
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this refund request?')) return;
    try {
      await api.delete(`/refunds/${id}`);
      setRefunds(prev => prev.filter(r => r._id !== id));
      toast.success('Refund deleted');
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Delete failed');
    }
  };

  const totals = {
    pending:   refunds.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
    processed: refunds.filter(r => r.status === 'processed').reduce((s, r) => s + r.amount, 0),
  };

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Refunds"
        description="Track and process order refunds. Wallet refunds automatically credit the customer."
        actions={<button onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }} className={`${btnPrimary} px-4 py-2 text-sm`}>+ New refund</button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total refunds', value: refunds.length },
          { label: 'Pending amount', value: formatPrice(totals.pending) },
          { label: 'Total refunded', value: formatPrice(totals.processed) },
          { label: 'Pending count', value: refunds.filter(r => r.status === 'pending').length },
        ].map(s => (
          <div key={s.label} className={`${adminPanel} p-4`}>
            <p className="text-lg font-semibold text-indigo-950">{s.value}</p>
            <p className="text-xs text-indigo-950/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create refund form */}
      {showForm && (
        <div className={`${adminPanel} p-6`}>
          <h2 className="mb-4 text-sm font-semibold text-indigo-950">Create refund</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={adminLabel}>Order ID</label>
              <input className={adminInput} placeholder="MongoDB order _id" value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} />
              <p className="mt-1 text-[11px] text-indigo-950/40">Paste the order&apos;s full ID from the Orders page</p>
            </div>
            <div>
              <label className={adminLabel}>Refund amount (₹)</label>
              <input className={adminInput} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Refund method</label>
              <select className={adminInput} value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                <option value="wallet">Wallet credit</option>
                <option value="bank">Bank transfer</option>
                <option value="razorpay">Razorpay</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={adminLabel}>Reason</label>
              <input className={adminInput} placeholder="e.g. Product damaged, wrong item delivered…" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Admin note (optional)</label>
              <input className={adminInput} placeholder="Internal note…" value={form.adminNote} onChange={e => setForm(p => ({ ...p, adminNote: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving} className={`${btnPrimary} px-4 py-2 text-sm disabled:opacity-60`}>
              {saving ? 'Creating…' : 'Create refund'}
            </button>
            <button onClick={() => setShowForm(false)} className={`${btnSecondary} px-4 py-2 text-sm`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Status action modal */}
      {actionModal && (
        <div className={`${adminPanel} p-6 max-w-md`}>
          <h2 className="mb-1 text-sm font-semibold text-indigo-950">Update refund status</h2>
          <p className="mb-4 text-xs text-indigo-950/50">Order: {actionModal.refund.orderNumber || actionModal.refund.order?._id} · {formatPrice(actionModal.refund.amount)}</p>
          <div className="mb-4">
            <label className={adminLabel}>Admin note (optional)</label>
            <input className={adminInput} placeholder="Reason for this action…" value={actionModal.note} onChange={e => setActionModal(p => p ? { ...p, note: e.target.value } : null)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {actionModal.refund.status === 'pending' && (
              <button onClick={() => handleStatus(actionModal.refund._id, 'approved', actionModal.note)} disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60">
                Approve
              </button>
            )}
            {['pending', 'approved'].includes(actionModal.refund.status) && (
              <button onClick={() => handleStatus(actionModal.refund._id, 'processed', actionModal.note)} disabled={saving} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60">
                Mark processed {actionModal.refund.method === 'wallet' ? '+ credit wallet' : ''}
              </button>
            )}
            {['pending', 'approved'].includes(actionModal.refund.status) && (
              <button onClick={() => handleStatus(actionModal.refund._id, 'rejected', actionModal.note)} disabled={saving} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition disabled:opacity-60">
                Reject
              </button>
            )}
            <button onClick={() => setActionModal(null)} className={`${btnSecondary} px-3 py-2 text-xs`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Refund table */}
      <div className={adminPanel}>
        <div className="flex flex-col gap-3 border-b border-indigo-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="text-sm font-semibold text-indigo-950">Refund requests</h2>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map(t => (
              <button key={t.key} onClick={() => setStatusFilter(t.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-indigo-950/40">Loading…</div>
        ) : refunds.length === 0 ? (
          <div className="py-14 text-center text-sm text-indigo-950/40">
            {statusFilter === 'all' ? 'No refund requests yet.' : `No ${statusFilter} refunds.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={adminTableHead}>
                  <th className="px-5 py-3 text-left sm:px-6">Order</th>
                  <th className="px-5 py-3 text-left sm:px-6">Customer</th>
                  <th className="px-5 py-3 text-left sm:px-6">Amount</th>
                  <th className="px-5 py-3 text-left sm:px-6">Method</th>
                  <th className="px-5 py-3 text-left sm:px-6">Reason</th>
                  <th className="px-5 py-3 text-left sm:px-6">Status</th>
                  <th className="px-5 py-3 text-left sm:px-6">Date</th>
                  <th className="px-5 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/60">
                {refunds.map(r => (
                  <tr key={r._id} className="transition hover:bg-indigo-50/50">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700 sm:px-6">
                      {r.orderNumber || r.order?.orderNumber || r.order?._id?.slice(-8) || '—'}
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <p className="font-medium text-slate-800">{r.user?.name || '—'}</p>
                      {r.user?.email && <p className="text-[11px] text-slate-400">{r.user.email}</p>}
                    </td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-rose-600 sm:px-6">{formatPrice(r.amount)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 sm:px-6">{METHOD_LABELS[r.method] || r.method}</td>
                    <td className="px-5 py-3.5 max-w-[180px] truncate text-xs text-slate-600 sm:px-6" title={r.reason}>{r.reason}</td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[r.status] || ''}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />{r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 sm:px-6">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex justify-end gap-1.5">
                        {r.status !== 'processed' && r.status !== 'rejected' && (
                          <button onClick={() => setActionModal({ refund: r, note: r.adminNote || '' })} className={`${btnSecondary} px-2.5 py-1 text-xs`}>
                            Update
                          </button>
                        )}
                        {r.status !== 'processed' && (
                          <button onClick={() => handleDelete(r._id)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
