'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

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
        toast.success('Updated');
      } else {
        await api.post('/mystery-boxes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Created');
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
    if (exists) setForm((prev: any) => ({ ...prev, productPool: pool.filter((p: any) => p.product !== productId) }));
    else setForm((prev: any) => ({ ...prev, productPool: [...pool, { product: productId, weight: 1 }] }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mystery Boxes</h1>
        <button onClick={openCreate} className="bg-pink-500 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-pink-600">
          + Create Box
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {boxes.map((box) => (
            <div key={box._id} className="bg-white border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase bg-pink-100 text-pink-700 px-2 py-1 rounded-full">{box.tier}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${box.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{box.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{box.name}</h3>
              <p className="text-2xl font-bold text-pink-600 mb-2">{formatPrice(box.price)}</p>
              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <p>{box.minProducts}–{box.maxProducts} products</p>
                <p>Min value: {formatPrice(box.minValue)}</p>
                <p>Stock: {box.stock} | Sold: {box.soldCount}</p>
                <p>Product Pool: {box.productPool?.length || 0} products</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(box)} className="flex-1 text-xs bg-blue-100 text-blue-700 py-2 rounded-full hover:bg-blue-200">Edit</button>
                <button onClick={() => handleDelete(box._id)} className="flex-1 text-xs bg-red-100 text-red-700 py-2 rounded-full hover:bg-red-200">Delete</button>
              </div>
            </div>
          ))}
          {boxes.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No mystery boxes yet</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-6">{editing ? 'Edit Mystery Box' : 'Create Mystery Box'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} required
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tier *</label>
                <select value={form.tier} onChange={(e) => setForm((p: any) => ({ ...p, tier: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                  <option value="basic">Basic (₹499)</option>
                  <option value="standard">Standard (₹999)</option>
                  <option value="premium">Premium (₹1999)</option>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="number" value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  required rows={3}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2">Product Pool (select eligible products)</label>
                <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
                  {products.length === 0 ? (
                    <p className="p-3 text-xs text-gray-400">No products marked as Mystery Box eligible. Edit products to enable.</p>
                  ) : (
                    products.map((p) => {
                      const inPool = form.productPool?.find((pp: any) => pp.product === p._id || pp.product?._id === p._id);
                      return (
                        <label key={p._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={!!inPool} onChange={() => toggleProduct(p._id)} />
                          <span className="text-sm">{p.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">{formatPrice(p.price)} | Stock: {p.stock}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{form.productPool?.length || 0} products selected</p>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  Active
                </label>
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-pink-500 text-white font-semibold py-3 rounded-full hover:bg-pink-600 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
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
