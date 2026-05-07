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
      if (editing) {
        await api.put(`/coupons/${editing._id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created');
      }
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (coupon: any) => {
    try {
      await api.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button onClick={openCreate} className="bg-pink-500 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-pink-600 transition-colors">
          + Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min Order</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(3)].map((_, i) => <tr key={i}><td colSpan={8}><div className="h-4 bg-gray-200 animate-pulse rounded m-4" /></td></tr>)
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No coupons yet</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-purple-600">{c.code}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{c.discountType}</td>
                    <td className="px-4 py-3 font-medium">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                      {c.maxDiscountAmount && <span className="text-xs text-gray-400 ml-1">(max {formatPrice(c.maxDiscountAmount)})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.usedCount}/{c.usageLimit || '∞'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <span className={new Date(c.expiryDate) < new Date() ? 'text-red-500' : ''}>{formatDate(c.expiryDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(c)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200">Edit</button>
                        <button onClick={() => handleDelete(c._id, c.code)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200">Delete</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-6">{editing ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Coupon Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  required disabled={!!editing}
                  className="w-full border rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type *</label>
                <select value={form.discountType} onChange={(e) => setForm((p: any) => ({ ...p, discountType: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount Value *</label>
                <input type="number" value={form.discountValue} onChange={(e) => setForm((p: any) => ({ ...p, discountValue: e.target.value }))}
                  required min="0"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount Amount (₹)</label>
                  <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((p: any) => ({ ...p, maxDiscountAmount: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Value (₹)</label>
                <input type="number" value={form.minOrderValue} onChange={(e) => setForm((p: any) => ({ ...p, minOrderValue: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usage Limit (blank = unlimited)</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm((p: any) => ({ ...p, usageLimit: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Per User Limit</label>
                <input type="number" value={form.perUserLimit} onChange={(e) => setForm((p: any) => ({ ...p, perUserLimit: e.target.value }))}
                  min="1"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date *</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm((p: any) => ({ ...p, expiryDate: e.target.value }))}
                  required min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  Active
                </label>
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-pink-500 text-white font-semibold py-3 rounded-full hover:bg-pink-600 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create Coupon'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border font-semibold py-3 rounded-full hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
