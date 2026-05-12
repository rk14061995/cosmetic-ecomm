'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY_FORM = { code: '', description: '', discountType: 'percentage', discountValue: '', maxDiscountAmount: '', minOrderValue: '', usageLimit: '', perUserLimit: '1', expiryDate: '', isActive: true };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = () => {
    api.get('/coupons')
      .then(({ data }) => setCoupons(data.coupons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ ...c, expiryDate: new Date(c.expiryDate).toISOString().split('T')[0], usageLimit: c.usageLimit || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.usageLimit) delete payload.usageLimit;
      if (!payload.maxDiscountAmount) delete payload.maxDiscountAmount;
      if (editing) { await api.put(`/coupons/${editing._id}`, payload); toast.success('Coupon updated'); }
      else { await api.post('/coupons', payload); toast.success('Coupon created'); }
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Coupon deleted'); fetchCoupons(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (coupon: any) => {
    try { await api.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive }); fetchCoupons(); }
    catch { toast.error('Failed to update'); }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage discount codes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Min Order</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Expiry</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="h-4 bg-slate-100 animate-pulse rounded-lg" /></td></tr>)
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-slate-400">No coupons yet. Create your first one.</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg text-xs tracking-wider">{c.code}</span>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">{c.discountType}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                      {c.maxDiscountAmount && <span className="text-xs text-slate-400 ml-1 font-normal">(max {formatPrice(c.maxDiscountAmount)})</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs font-mono">{c.usedCount}/{c.usageLimit || '∞'}</td>
                    <td className="px-5 py-4 text-xs">
                      <span className={new Date(c.expiryDate) < new Date() ? 'text-red-500 font-medium' : 'text-slate-500'}>
                        {formatDate(c.expiryDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(c)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium transition-colors">Edit</button>
                        <button onClick={() => handleDelete(c._id, c.code)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <p className="text-sm text-slate-500 mb-6">{editing ? `Editing ${editing.code}` : 'Set up a new discount code'}</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Coupon Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  required disabled={!!editing} className={inputCls + ' font-mono uppercase tracking-widest'} />
              </div>
              <div>
                <label className={labelCls}>Discount Type *</label>
                <select value={form.discountType} onChange={(e) => setForm((p: any) => ({ ...p, discountType: e.target.value }))} className={inputCls}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Discount Value *</label>
                <input type="number" value={form.discountValue} onChange={(e) => setForm((p: any) => ({ ...p, discountValue: e.target.value }))}
                  required min="0" className={inputCls} />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label className={labelCls}>Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((p: any) => ({ ...p, maxDiscountAmount: e.target.value }))} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Min Order Value (₹)</label>
                <input type="number" value={form.minOrderValue} onChange={(e) => setForm((p: any) => ({ ...p, minOrderValue: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Usage Limit (blank = unlimited)</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm((p: any) => ({ ...p, usageLimit: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Per User Limit</label>
                <input type="number" value={form.perUserLimit} onChange={(e) => setForm((p: any) => ({ ...p, perUserLimit: e.target.value }))} min="1" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Expiry Date *</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm((p: any) => ({ ...p, expiryDate: e.target.value }))}
                  required min={new Date().toISOString().split('T')[0]} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} className="accent-violet-600" />
                  Active
                </label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
