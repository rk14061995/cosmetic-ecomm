'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', description: '', shortDescription: '', price: '', discountPrice: '', category: '',
  brand: '', stock: '', tags: '', ingredients: '', howToUse: '', weight: '',
  isFeatured: false, isNewArrival: false, isBestSeller: false, isActive: true, eligibleForMysteryBox: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/products${q}`)
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);
  useEffect(() => {
    api.get('/categories?includeInactive=true')
      .then(({ data }) => {
        const list = data.categories || [];
        setCategories(list);
        if (!form.category && list.length > 0) setForm((p: any) => ({ ...p, category: list[0].name }));
      })
      .catch(() => setCategories([]));
  }, []);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, category: categories[0]?.name || '' }); setImageFiles([]); setShowForm(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ ...p, price: p.price, discountPrice: p.discountPrice || '', stock: p.stock, tags: p.tags?.join(', ') || '' }); setImageFiles([]); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v)); });
      imageFiles.forEach((f) => fd.append('images', f));
      if (editing) {
        await api.put(`/products/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete product'); }
  };

  const toggleActive = async (product: any) => {
    try { await api.put(`/products/${product._id}`, { isActive: !product.isActive }); fetchProducts(); }
    catch { toast.error('Failed to update'); }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    setCreatingCategory(true);
    try {
      const { data } = await api.post('/categories', { name: newCategory.trim() });
      const created = data.category;
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((p: any) => ({ ...p, category: created.name }));
      setNewCategory('');
      toast.success('Category created');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally { setCreatingCategory(false); }
  };

  const handleDeleteCategory = async (category: any) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await api.delete(`/categories/${category._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
      if (form.category === category.name) setForm((p: any) => ({ ...p, category: '' }));
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your product catalogue</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Category Manager */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-800 mb-3">Categories</p>
        <div className="flex items-center gap-3 mb-3">
          <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-64" />
          <button type="button" onClick={handleCreateCategory} disabled={creatingCategory}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
            {creatingCategory ? 'Adding…' : 'Add'}
          </button>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c._id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {c.name}
                <button type="button" onClick={() => handleDeleteCategory(c)} className="text-current opacity-50 hover:opacity-100 font-bold leading-none">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-4 bg-slate-100 animate-pulse rounded-lg" /></td></tr>)
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg text-slate-400">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="w-5 h-5">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.brand}</p>
                          <div className="flex gap-1 mt-1">
                            {p.isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 font-semibold">Featured</span>}
                            {p.isNewArrival && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 font-semibold">New</span>}
                            {p.isBestSeller && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-semibold">Best Seller</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{p.category}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">{formatPrice(p.discountPrice || p.price)}</span>
                      {p.discountPrice && <span className="text-xs text-slate-400 line-through ml-1">{formatPrice(p.price)}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-medium ${p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-amber-600' : 'text-slate-700'}`}>{p.stock}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <span className="text-amber-400">★</span> {p.ratings?.toFixed(1) || '0.0'} <span className="text-xs text-slate-400">({p.numReviews || 0})</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(p)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium transition-colors">Edit</button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-1">{editing ? 'Edit Product' : 'Add New Product'}</h3>
            <p className="text-sm text-slate-500 mb-6">{editing ? `Editing: ${editing.name}` : 'Fill in product details below'}</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Product Name *', col: 'col-span-2', required: true },
                { key: 'brand', label: 'Brand *', required: true },
                { key: 'price', label: 'Price (₹) *', type: 'number', required: true },
                { key: 'discountPrice', label: 'Discount Price (₹)', type: 'number' },
                { key: 'stock', label: 'Stock *', type: 'number', required: true },
                { key: 'weight', label: 'Weight' },
              ].map(({ key, label, col, type = 'text', required }) => (
                <div key={key} className={col || ''}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required} className={inputCls} />
                </div>
              ))}

              <div>
                <label className={labelCls}>Category *</label>
                <select value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))} className={inputCls}>
                  <option value="">Select category</option>
                  {categories.filter((c) => c.isActive).map((c) => <option key={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm((p: any) => ({ ...p, tags: e.target.value }))}
                  placeholder="moisturizer, spf, vitamin c" className={inputCls} />
              </div>

              {[
                { key: 'shortDescription', label: 'Short Description (max 300 chars)', col: 'col-span-2', rows: 2 },
                { key: 'description', label: 'Full Description *', col: 'col-span-2', rows: 4, required: true },
                { key: 'ingredients', label: 'Ingredients', col: 'col-span-2', rows: 3 },
                { key: 'howToUse', label: 'How to Use', col: 'col-span-2', rows: 2 },
              ].map(({ key, label, col, rows, required }) => (
                <div key={key} className={col}>
                  <label className={labelCls}>{label}</label>
                  <textarea value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required} rows={rows} className={inputCls + ' resize-none'} />
                </div>
              ))}

              <div className="col-span-2">
                <label className={labelCls}>Product Images</label>
                <input type="file" ref={fileRef} multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-xl py-8 text-sm text-slate-400 hover:text-violet-500 transition-colors text-center">
                  {imageFiles.length > 0
                    ? <span className="font-medium text-violet-600">{imageFiles.length} image(s) selected</span>
                    : <span>Click to upload images</span>}
                </button>
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Flags</label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {[
                    { key: 'isFeatured', label: 'Featured' },
                    { key: 'isNewArrival', label: 'New Arrival' },
                    { key: 'isBestSeller', label: 'Best Seller' },
                    { key: 'isActive', label: 'Active' },
                    { key: 'eligibleForMysteryBox', label: 'Mystery Box Eligible' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="accent-violet-600" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
