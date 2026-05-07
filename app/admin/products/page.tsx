'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Body Care', 'Tools & Accessories'];
const EMPTY_FORM = { name: '', description: '', shortDescription: '', price: '', discountPrice: '', category: 'Skincare', brand: '', stock: '', tags: '', ingredients: '', howToUse: '', weight: '', isFeatured: false, isActive: true, eligibleForMysteryBox: false };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/products${q}`)
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setImageFiles([]); setShowForm(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ ...p, price: p.price, discountPrice: p.discountPrice || '', stock: p.stock, tags: p.tags?.join(', ') || '' });
    setImageFiles([]);
    setShowForm(true);
  };

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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
  };

  const toggleActive = async (product: any) => {
    try {
      await api.put(`/products/${product._id}`, { isActive: !product.isActive });
      fetchProducts();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openCreate} className="bg-pink-500 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-pink-600 transition-colors flex items-center gap-2">
          <span>+</span> Add Product
        </button>
      </div>

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full max-w-md border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="text-xl flex items-center justify-center h-full">💄</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{formatPrice(p.discountPrice || p.price)}</span>
                      {p.discountPrice && <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(p.price)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? 'text-red-600 font-medium' : p.stock < 10 ? 'text-orange-500 font-medium' : ''}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-500">★</span> {p.ratings?.toFixed(1) || '0.0'} ({p.numReviews || 0})
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(p)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200">Edit</button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200">Delete</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-6">{editing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Product Name', col: 'col-span-2', required: true },
                { key: 'brand', label: 'Brand', required: true },
                { key: 'price', label: 'Price (₹)', type: 'number', required: true },
                { key: 'discountPrice', label: 'Discount Price (₹)', type: 'number' },
                { key: 'stock', label: 'Stock', type: 'number', required: true },
                { key: 'weight', label: 'Weight' },
              ].map(({ key, label, col, type = 'text', required }) => (
                <div key={key} className={col || ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm((p: any) => ({ ...p, tags: e.target.value }))}
                  placeholder="moisturizer, spf, vitamin c"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>

              {[
                { key: 'shortDescription', label: 'Short Description (max 300 chars)', col: 'col-span-2', rows: 2 },
                { key: 'description', label: 'Full Description *', col: 'col-span-2', rows: 4, required: true },
                { key: 'ingredients', label: 'Ingredients', col: 'col-span-2', rows: 3 },
                { key: 'howToUse', label: 'How to Use', col: 'col-span-2', rows: 2 },
              ].map(({ key, label, col, rows, required }) => (
                <div key={key} className={col}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <textarea value={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                    required={required} rows={rows}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Images</label>
                <input type="file" ref={fileRef} multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-sm text-gray-500 hover:border-pink-400 hover:text-pink-500 transition-colors">
                  {imageFiles.length > 0 ? `${imageFiles.length} image(s) selected` : '+ Click to upload images'}
                </button>
              </div>

              <div className="col-span-2 flex gap-6">
                {[
                  { key: 'isFeatured', label: 'Featured Product' },
                  { key: 'isActive', label: 'Active' },
                  { key: 'eligibleForMysteryBox', label: 'Mystery Box Eligible' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="text-pink-500" />
                    {label}
                  </label>
                ))}
              </div>

              <div className="col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-pink-500 text-white font-semibold py-3 rounded-full hover:bg-pink-600 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border font-semibold py-3 rounded-full hover:bg-gray-50">
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
