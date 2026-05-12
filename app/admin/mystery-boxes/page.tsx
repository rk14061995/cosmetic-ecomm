'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const TIER_COLORS: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  standard: 'bg-violet-100 text-violet-700',
  premium: 'bg-amber-100 text-amber-700',
};

export default function AdminMysteryBoxesPage() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ name: '', tier: 'basic', price: '', description: '', minProducts: 3, maxProducts: 5, minValue: '', stock: 100, isActive: true, productPool: [], possibleItems: [] });

  const fetchData = () => {
    Promise.all([
      api.get('/mystery-boxes/admin/all'),
      api.get('/products?eligibleForMysteryBox=true&limit=100'),
    ]).then(([boxRes, prodRes]) => {
      setBoxes(boxRes.data.mysteryBoxes || []);
      setProducts(prodRes.data.products || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', tier: 'basic', price: '', description: '', minProducts: 3, maxProducts: 5, minValue: '', stock: 100, isActive: true, productPool: [], possibleItems: [] });
    setShowForm(true);
  };
  const openEdit = (b: any) => { setEditing(b); setForm({ ...b }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'productPool' || k === 'possibleItems') fd.append(k, JSON.stringify(v));
        else if (v !== '' && v !== null) fd.append(k, String(v));
      });
      if (editing) {
        await api.put(`/mystery-boxes/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mystery box updated');
      } else {
        await api.post('/mystery-boxes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mystery box created');
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mystery box?')) return;
    try { await api.delete(`/mystery-boxes/${id}`); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleProduct = (productId: string) => {
    const pool = form.productPool || [];
    const exists = pool.find((p: any) => p.product === productId);
    setForm((prev: any) => ({
      ...prev,
      productPool: exists ? pool.filter((p: any) => p.product !== productId) : [...pool, { product: productId, weight: 1 }],
    }));
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mystery Boxes</h1>
          <p className="text-sm text-slate-500 mt-1">Manage curated mystery beauty box tiers</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Box
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-white animate-pulse rounded-2xl border border-slate-100 shadow-sm" />)}
        </div>
      ) : boxes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 text-slate-400">
          <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
          </svg>
          <p className="font-medium">No mystery boxes yet</p>
          <p className="text-sm mt-1">Create your first box to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {boxes.map((box) => (
            <div key={box._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${TIER_COLORS[box.tier] || 'bg-slate-100 text-slate-600'}`}>
                  {box.tier}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${box.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  {box.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{box.name}</h3>
              <p className="text-2xl font-bold text-violet-600 mb-3">{formatPrice(box.price)}</p>
              <div className="text-xs text-slate-500 space-y-1.5 mb-5 flex-1">
                <div className="flex justify-between">
                  <span>Products per box</span>
                  <span className="font-medium text-slate-700">{box.minProducts}–{box.maxProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min guaranteed value</span>
                  <span className="font-medium text-slate-700">{formatPrice(box.minValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stock / Sold</span>
                  <span className="font-medium text-slate-700">{box.stock} / {box.soldCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Product pool</span>
                  <span className="font-medium text-slate-700">{box.productPool?.length || 0} items</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(box)} className="flex-1 text-xs bg-blue-100 text-blue-700 py-2 rounded-xl hover:bg-blue-200 font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(box._id)} className="flex-1 text-xs bg-red-100 text-red-700 py-2 rounded-xl hover:bg-red-200 font-medium transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">{editing ? 'Edit Mystery Box' : 'Create Mystery Box'}</h3>
            <p className="text-sm text-slate-500 mb-6">{editing ? editing.name : 'Configure a new box tier'}</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tier *</label>
                <select value={form.tier} onChange={(e) => setForm((p: any) => ({ ...p, tier: e.target.value }))} className={inputCls}>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              {[
                { key: 'price', label: 'Price (₹) *', required: true },
                { key: 'minValue', label: 'Min Guaranteed Value (₹) *', required: true },
                { key: 'stock', label: 'Stock' },
                { key: 'minProducts', label: 'Min Products' },
                { key: 'maxProducts', label: 'Max Products' },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))} required={required} className={inputCls} />
                </div>
              ))}
              <div className="col-span-2">
                <label className={labelCls}>Description *</label>
                <textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} required rows={3} className={inputCls + ' resize-none'} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Product Pool ({form.productPool?.length || 0} selected)</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {products.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400">No products marked as Mystery Box eligible. Edit products to enable.</p>
                  ) : products.map((p) => {
                    const inPool = form.productPool?.find((pp: any) => pp.product === p._id || pp.product?._id === p._id);
                    return (
                      <label key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={!!inPool} onChange={() => toggleProduct(p._id)} className="accent-violet-600" />
                        <span className="text-sm text-slate-700 flex-1">{p.name}</span>
                        <span className="text-xs text-slate-400">{formatPrice(p.price)} · {p.stock} in stock</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} className="accent-violet-600" />
                  Active
                </label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update Box' : 'Create Box'}
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
