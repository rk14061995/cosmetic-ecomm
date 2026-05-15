'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AdminPageHeader, adminPanel, adminStack, adminInput, adminLabel, adminTableHead, btnPrimary, btnSecondary } from '@/components/admin/ui';
import type { Expense, ApiError } from '@/types/api';

type FilterKey = 'all' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This week' },
  { key: 'monthly', label: 'This month' },
  { key: 'quarterly', label: 'This quarter' },
  { key: 'yearly', label: 'This year' },
];

function getDateRange(filter: FilterKey): { from?: string; to?: string } {
  const now = new Date();
  const start = new Date(now);
  switch (filter) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    case 'weekly': {
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    }
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    case 'quarterly': {
      const q = Math.floor(now.getMonth() / 3);
      start.setMonth(q * 3, 1);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    }
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString() };
    default:
      return {};
  }
}

const EMPTY = { name: '', amount: '', note: '' };
const SUGGESTIONS = ['Packaging box', 'Tape', 'Package bag', 'Printing', 'Labels', 'Bubble wrap', 'Courier bag', 'Filler material'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const fetchExpenses = useCallback((f: FilterKey) => {
    setLoading(true);
    const { from, to } = getDateRange(f);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api.get(`/expenses?${params}`)
      .then(({ data }) => setExpenses(data.expenses))
      .catch((err: unknown) => toast.error((err as ApiError).response?.data?.message || 'Failed to load expenses'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchExpenses(filter); }, [filter, fetchExpenses]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (e: Expense) => {
    setForm({ name: e.name, amount: String(e.amount), note: e.note || '' });
    setEditId(e._id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount) { toast.error('Name and amount are required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), amount: Number(form.amount), note: form.note.trim() || undefined };
      if (editId) {
        const { data } = await api.put(`/expenses/${editId}`, payload);
        setExpenses((prev) => prev.map((e) => (e._id === editId ? data.expense : e)));
        toast.success('Expense updated');
      } else {
        const { data } = await api.post('/expenses', payload);
        setExpenses((prev) => [data.expense, ...prev]);
        toast.success('Expense added');
      }
      closeForm();
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      toast.success('Expense deleted');
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.message || 'Delete failed');
    }
  };

  const activeFilter = FILTERS.find((f) => f.key === filter)!;

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Expenses"
        description="Track packaging, printing, and other overhead costs. These are added to your total investment figure."
        actions={<button onClick={openAdd} className={`${btnPrimary} px-4 py-2 text-sm`}>+ Add expense</button>}
      />

      {showForm && (
        <div className={`${adminPanel} p-6`}>
          <h2 className="mb-4 text-sm font-semibold text-indigo-950">{editId ? 'Edit expense' : 'New expense'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={adminLabel}>Name</label>
              <input
                className={adminInput}
                placeholder="e.g. Packaging boxes"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {!editId && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, name: s }))}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={adminLabel}>Amount (₹)</label>
              <input
                className={adminInput}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className={adminLabel}>Note (optional)</label>
              <input
                className={adminInput}
                placeholder="Qty, vendor, batch..."
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} disabled={saving} className={`${btnPrimary} px-4 py-2 text-sm disabled:opacity-60`}>
              {saving ? 'Saving…' : editId ? 'Update' : 'Add'}
            </button>
            <button onClick={closeForm} className={`${btnSecondary} px-4 py-2 text-sm`}>Cancel</button>
          </div>
        </div>
      )}

      <div className={adminPanel}>
        <div className="flex flex-col gap-3 border-b border-indigo-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-indigo-950">
              {activeFilter.label === 'All time' ? 'All expenses' : `Expenses — ${activeFilter.label}`}
            </h2>
            <p className="text-xs text-indigo-950/50">
              Total: <span className="font-semibold text-amber-700">{formatPrice(total)}</span>
              {filter !== 'all' && <span className="ml-1 text-indigo-950/35">({expenses.length} {expenses.length === 1 ? 'entry' : 'entries'})</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === f.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-14 text-center text-sm text-indigo-950/40">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-indigo-950/40">
            {filter === 'all'
              ? 'No expenses yet. Add packaging, printing, and other costs to track your full investment.'
              : `No expenses recorded for ${activeFilter.label.toLowerCase()}.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={adminTableHead}>
                  <th className="px-5 py-3 sm:px-6 text-left">Name</th>
                  <th className="px-5 py-3 sm:px-6 text-left">Amount</th>
                  <th className="px-5 py-3 sm:px-6 text-left">Note</th>
                  <th className="px-5 py-3 sm:px-6 text-left">Added</th>
                  <th className="px-5 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/60">
                {expenses.map((e) => (
                  <tr key={e._id} className="transition hover:bg-indigo-50/50">
                    <td className="px-5 py-3.5 font-medium text-slate-800 sm:px-6">{e.name}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-amber-700 sm:px-6">{formatPrice(e.amount)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 sm:px-6">{e.note || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 sm:px-6">{formatDate(e.createdAt)}</td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(e)} className={`${btnSecondary} px-2.5 py-1 text-xs`}>Edit</button>
                        <button onClick={() => handleDelete(e._id)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100">Delete</button>
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
