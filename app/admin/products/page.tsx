'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminModal,
  adminPanel,
  adminStack,
  adminTableHead,
  adminInput,
  adminLabel,
  btnAccent,
  btnPrimary,
  btnSecondary,
} from '@/components/admin/ui';

const EMPTY_FORM = {
  name: '', description: '', shortDescription: '', price: '', discountPrice: '', category: '',
  brand: '', stock: '', tags: '', ingredients: '', howToUse: '', weight: '',
  isFeatured: false, isNewArrival: false, isBestSeller: false, isActive: true, eligibleForMysteryBox: false,
  virtualTryOn: false,
  tryOnTintHex: '#db2777',
};

/** Only these keys are sent as multipart fields; excludes nested docs like images/reviews from spread form. */
const PRODUCT_FORM_KEYS = [
  'name', 'description', 'shortDescription', 'price', 'discountPrice', 'category', 'brand', 'stock',
  'tags', 'ingredients', 'howToUse', 'weight', 'slug',
  'isFeatured', 'isNewArrival', 'isBestSeller', 'isActive', 'eligibleForMysteryBox',
  'virtualTryOn', 'tryOnTintHex',
] as const;

function appendProductFields(fd: FormData, form: Record<string, unknown>) {
  for (const k of PRODUCT_FORM_KEYS) {
    const v = form[k];
    if (v === '' || v === null || v === undefined) continue;
    fd.append(k, typeof v === 'boolean' ? String(v) : String(v));
  }
}

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
  const [existingImages, setExistingImages] = useState<{ url: string; publicId?: string }[]>([]);
  const [removingPublicId, setRemovingPublicId] = useState<string | null>(null);
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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.name || '' });
    setImageFiles([]);
    setExistingImages([]);
    setShowForm(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    const hex = typeof p.tryOnTintHex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p.tryOnTintHex.trim())
      ? p.tryOnTintHex.trim()
      : '#db2777';
    setForm({
      ...p,
      price: p.price,
      discountPrice: p.discountPrice || '',
      stock: p.stock,
      tags: p.tags?.join(', ') || '',
      virtualTryOn: Boolean(p.virtualTryOn),
      tryOnTintHex: hex,
    });
    setImageFiles([]);
    setExistingImages(Array.isArray(p.images) ? p.images.map((img: any) => ({ url: img.url, publicId: img.publicId })) : []);
    setShowForm(true);
  };

  const moveExistingImage = (index: number, delta: number) => {
    setExistingImages((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const handleRemoveExistingImage = async (publicId: string) => {
    if (!editing?._id) return;
    if (!publicId) {
      toast.error('This image has no Cloudinary id and cannot be removed from here.');
      return;
    }
    if (!confirm('Remove this image from the product?')) return;
    setRemovingPublicId(publicId);
    try {
      const { data } = await api.delete(`/products/${editing._id}/images/${encodeURIComponent(publicId)}`);
      const next = data.images || [];
      setExistingImages(next);
      setEditing((prev: any) => (prev ? { ...prev, images: next } : null));
      toast.success('Image removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove image');
    } finally {
      setRemovingPublicId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      appendProductFields(fd, form);
      if (editing) {
        fd.append('existingImagesJson', JSON.stringify(existingImages));
      }
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

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Products"
        description="Manage catalogue, pricing, media, and merchandising flags."
        actions={
          <button type="button" onClick={openCreate} className={btnAccent}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add product
          </button>
        }
      />

      <div className={`${adminPanel} p-5 sm:p-6`}>
        <p className="text-sm font-semibold text-slate-900">Categories</p>
        <p className="mt-0.5 text-xs text-slate-500">Used for navigation and product assignment</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className={`${adminInput} max-w-xs min-w-[12rem]`}
          />
          <button type="button" onClick={handleCreateCategory} disabled={creatingCategory} className={btnPrimary}>
            {creatingCategory ? 'Adding…' : 'Add category'}
          </button>
        </div>
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c._id}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  c.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c)}
                  className="font-bold leading-none text-current opacity-50 hover:opacity-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`${adminPanel} p-4 sm:p-5`}>
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className={`${adminInput} pl-10`}
          />
        </div>
      </div>

      <div className={`${adminPanel} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
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
                            {p.isFeatured && <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-800">Featured</span>}
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
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openEdit(p)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id, p.name)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 shadow-sm transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <AdminModal className="my-6 flex min-h-0 max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden p-0">
            <div className="border-b border-slate-200/90 px-6 py-4">
              <h3 className="mb-1 text-lg font-semibold text-slate-900">{editing ? 'Edit product' : 'Add new product'}</h3>
              <p className="text-sm text-slate-500">{editing ? `Editing: ${editing.name}` : 'Fill in product details below.'}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-3">
              {[
                { key: 'name', label: 'Product Name *', col: 'md:col-span-2', required: true },
                { key: 'brand', label: 'Brand *', required: true },
                { key: 'price', label: 'Price (₹) *', type: 'number', required: true },
                { key: 'discountPrice', label: 'Discount Price (₹)', type: 'number' },
                { key: 'stock', label: 'Stock *', type: 'number', required: true },
                { key: 'weight', label: 'Weight' },
              ].map(({ key, label, col, type = 'text', required }) => (
                <div key={key} className={col || ''}>
                  <label className={adminLabel}>{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required} className={adminInput} />
                </div>
              ))}

              <div>
                <label className={adminLabel}>Category *</label>
                <select value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))} className={adminInput}>
                  <option value="">Select category</option>
                  {categories.filter((c) => c.isActive).map((c) => <option key={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={adminLabel}>Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm((p: any) => ({ ...p, tags: e.target.value }))}
                  placeholder="moisturizer, spf, vitamin c" className={adminInput} />
              </div>

              {[
                { key: 'shortDescription', label: 'Short Description', col: 'md:col-span-3', rows: 2 },
                { key: 'description', label: 'Full Description *', col: 'md:col-span-3', rows: 3, required: true },
                { key: 'ingredients', label: 'Ingredients', col: 'md:col-span-2', rows: 2 },
                { key: 'howToUse', label: 'How to Use', col: 'md:col-span-1', rows: 2 },
              ].map(({ key, label, col, rows, required }) => (
                <div key={key} className={col}>
                  <label className={adminLabel}>{label}</label>
                  <textarea value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required} rows={rows} className={adminInput + ' resize-none'} />
                </div>
              ))}

              <div className="md:col-span-2 space-y-3">
                <label className={adminLabel}>Product Images</label>
                {editing && existingImages.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Current images — order is saved when you update the product. The first image is the main listing photo.
                    </p>
                    <div className="flex flex-wrap gap-4 items-end">
                      {existingImages.map((img, idx) => {
                        const canRemove = Boolean(img.publicId);
                        return (
                          <div key={`${idx}-${img.publicId || img.url}`} className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 tabular-nums">{idx + 1}</span>
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                              <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                              <button
                                type="button"
                                disabled={!canRemove || removingPublicId === img.publicId}
                                title={canRemove ? 'Remove image' : 'No Cloudinary id — cannot remove via API'}
                                onClick={() => img.publicId && handleRemoveExistingImage(img.publicId)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/65 text-white text-sm leading-none flex items-center justify-center hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {removingPublicId === img.publicId ? '…' : '×'}
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveExistingImage(idx, -1)}
                                className="px-2 py-0.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Move earlier"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={idx === existingImages.length - 1}
                                onClick={() => moveExistingImage(idx, 1)}
                                className="px-2 py-0.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Move later"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <input type="file" ref={fileRef} multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 transition-colors hover:border-indigo-300 hover:text-indigo-600">
                  {imageFiles.length > 0
                    ? <span className="font-medium text-indigo-600">{imageFiles.length} new file(s) selected — appended on save</span>
                    : <span>{editing ? 'Add more images' : 'Click to upload images'}</span>}
                </button>
              </div>

              <div className="md:col-span-1">
                <label className={adminLabel}>Flags</label>
                <div className="grid grid-cols-1 gap-2 mt-1 border border-slate-200 rounded-xl p-3">
                  {[
                    { key: 'isFeatured', label: 'Featured' },
                    { key: 'isNewArrival', label: 'New Arrival' },
                    { key: 'isBestSeller', label: 'Best Seller' },
                    { key: 'isActive', label: 'Active' },
                    { key: 'eligibleForMysteryBox', label: 'Mystery Box Eligible' },
                    { key: 'virtualTryOn', label: 'Virtual try-on (customer photo preview)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="accent-indigo-600" />
                      {label}
                    </label>
                  ))}
                  {form.virtualTryOn && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <label className={adminLabel}>Try-on tint colour</label>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(String(form.tryOnTintHex || '').trim()) ? String(form.tryOnTintHex).trim() : '#db2777'}
                          onChange={(e) => setForm((p: any) => ({ ...p, tryOnTintHex: e.target.value }))}
                          className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                          title="Shade used for the on-device tint overlay"
                        />
                        <input
                          type="text"
                          value={form.tryOnTintHex || ''}
                          onChange={(e) => setForm((p: any) => ({ ...p, tryOnTintHex: e.target.value }))}
                          placeholder="#db2777"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          className={`${adminInput} flex-1 min-w-[7rem] font-mono text-xs`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Shoppers upload a photo in the browser only; this hex sets the default tint (lip / blush preview).
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="flex gap-3 border-t border-slate-200/90 bg-white px-6 py-4">
                <button type="submit" disabled={saving} className={`${btnPrimary} flex-1 py-3`}>
                  {saving ? 'Saving…' : editing ? 'Update product' : 'Create product'}
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
