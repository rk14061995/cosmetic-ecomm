'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminModal,
  adminInput,
  adminLabel,
  adminPanel,
  adminStack,
  btnAccent,
  btnPrimary,
  btnSecondary,
} from '@/components/admin/ui';
import type { MysteryBox, Product, ApiError } from '@/types/api';

type MysteryBoxPoolEntry = { product: string; weight: number };
type MysteryBoxForm = {
  name: string; tier: string; price: string | number; description: string;
  minProducts: number; maxProducts: number; minValue: string | number;
  stock: number; isActive: boolean; productPool: MysteryBoxPoolEntry[]; possibleItems: unknown[];
};

const TIER_COLORS: Record<string, string> = {
  basic: 'bg-slate-100 text-slate-700',
  standard: 'bg-indigo-100 text-indigo-800',
  premium: 'bg-amber-100 text-amber-800',
};

export default function AdminMysteryBoxesPage() {
  const [boxes, setBoxes] = useState<MysteryBox[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MysteryBox | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MysteryBoxForm>({ name: '', tier: 'basic', price: '', description: '', minProducts: 3, maxProducts: 5, minValue: '', stock: 100, isActive: true, productPool: [], possibleItems: [] });

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
  const openEdit = (b: MysteryBox) => {
    setEditing(b);
    setForm({
      name: b.name,
      tier: b.tier,
      price: b.price,
      description: b.description,
      minProducts: b.minProducts,
      maxProducts: b.maxProducts,
      minValue: b.minValue,
      stock: b.stock,
      isActive: b.isActive,
      productPool: (b.productPool || []).map((pp) => ({
        product: typeof pp.product === 'string' ? pp.product : pp.product._id,
        weight: pp.weight ?? 1,
      })),
      possibleItems: [],
    });
    setShowForm(true);
  };

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
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mystery box?')) return;
    try { await api.delete(`/mystery-boxes/${id}`); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleProduct = (productId: string) => {
    const pool = form.productPool || [];
    const exists = pool.find((p) => p.product === productId);
    setForm((prev) => ({
      ...prev,
      productPool: exists ? pool.filter((p) => p.product !== productId) : [...pool, { product: productId, weight: 1 }],
    }));
  };

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Mystery boxes"
        description="Manage curated mystery beauty box tiers, stock, and product pools."
        actions={
          <button type="button" onClick={openCreate} className={btnAccent}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create box
          </button>
        }
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className={`${adminPanel} h-52 animate-pulse bg-slate-50`} />)}
        </div>
      ) : boxes.length === 0 ? (
        <div className={`${adminPanel} flex flex-col items-center justify-center py-20 text-slate-400`}>
          <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
          </svg>
          <p className="font-medium">No mystery boxes yet</p>
          <p className="text-sm mt-1">Create your first box to get started</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => (
            <div key={box._id} className={`${adminPanel} flex flex-col p-5`}>
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
              <p className="mb-3 text-2xl font-semibold tracking-tight text-indigo-600">{formatPrice(box.price)}</p>
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
                <button type="button" onClick={() => openEdit(box)} className={`${btnSecondary} flex-1 py-2 text-xs`}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(box._id)}
                  className="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-medium text-rose-900 transition hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <AdminModal className="my-8 max-w-2xl">
            <h3 className="mb-1 text-lg font-semibold text-slate-900">{editing ? 'Edit mystery box' : 'Create mystery box'}</h3>
            <p className="mb-6 text-sm text-slate-500">{editing ? editing.name : 'Configure a new box tier.'}</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className={adminLabel}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={adminInput} />
              </div>
              <div>
                <label className={adminLabel}>Tier *</label>
                <select value={form.tier} onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value }))} className={adminInput}>
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
                  <label className={adminLabel}>{label}</label>
                  <input type="number" value={form[key as keyof MysteryBoxForm] as string | number} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value } as MysteryBoxForm))} required={required} className={adminInput} />
                </div>
              ))}
              <div className="col-span-2">
                <label className={adminLabel}>Description *</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required rows={3} className={adminInput + ' resize-none'} />
              </div>
              <div className="col-span-2">
                <label className={adminLabel}>Product Pool ({form.productPool?.length || 0} selected)</label>
                <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                  {products.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400">No products marked as Mystery Box eligible. Edit products to enable.</p>
                  ) : products.map((p) => {
                    const inPool = form.productPool?.find((pp) => pp.product === p._id);
                    return (
                      <label key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={!!inPool} onChange={() => toggleProduct(p._id)} className="accent-indigo-600" />
                        <span className="text-sm text-slate-700 flex-1">{p.name}</span>
                        <span className="text-xs text-slate-400">{formatPrice(p.price)} · {p.stock} in stock</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="accent-indigo-600" />
                  Active
                </label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`${btnPrimary} flex-1 py-3`}>
                  {saving ? 'Saving…' : editing ? 'Update box' : 'Create box'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className={`${btnSecondary} flex-1 py-3`}>
                  Cancel
                </button>
              </div>
            </form>
          </AdminModal>
        </div>
      )}
    </div>
  );
}
