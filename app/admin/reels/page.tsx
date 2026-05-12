'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', creator: '', image: '', ctaLink: '/mystery-boxes', section: 'mystery-boxes', isActive: true, sortOrder: 0 };

export default function AdminReelsPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchReels = () => {
    setLoading(true);
    api.get('/reels?includeInactive=true&section=mystery-boxes')
      .then(({ data }) => setReels(data.reels || []))
      .catch(() => toast.error('Failed to load reels'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReels(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?._id) { await api.put(`/reels/${editing._id}`, form); toast.success('Reel updated'); }
      else { await api.post('/reels', form); toast.success('Reel created'); }
      fetchReels();
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save reel');
    } finally { setSaving(false); }
  };

  const deleteReel = async (id: string) => {
    if (!confirm('Delete this reel?')) return;
    try { await api.delete(`/reels/${id}`); toast.success('Reel deleted'); fetchReels(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete reel'); }
  };

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Unboxing Reels</h1>
        <p className="text-sm text-slate-500 mt-1">Manage social proof reels shown on the homepage</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Reel' : 'Add New Reel'}</h2>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reel Title *</label>
            <input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Unboxing Premium Box" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Creator Handle *</label>
            <input value={form.creator} onChange={(e) => setForm((p: any) => ({ ...p, creator: e.target.value }))}
              placeholder="@riya.beauty" required className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Image URL *</label>
            <input value={form.image} onChange={(e) => setForm((p: any) => ({ ...p, image: e.target.value }))}
              placeholder="https://res.cloudinary.com/…" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">CTA Link</label>
            <input value={form.ctaLink} onChange={(e) => setForm((p: any) => ({ ...p, ctaLink: e.target.value }))}
              placeholder="/mystery-boxes" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm((p: any) => ({ ...p, sortOrder: Number(e.target.value) }))}
              className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} className="accent-violet-600" />
              Active (visible on homepage)
            </label>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : editing ? 'Update Reel' : 'Add Reel'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Reels List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Existing Reels</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : reels.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No reels yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {reels.map((reel) => (
              <div key={reel._id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{reel.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${reel.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {reel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{reel.creator} &middot; Order: {reel.sortOrder}</p>
                  <p className="text-xs text-violet-500 mt-1 truncate max-w-sm">{reel.image}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditing(reel); setForm({ ...reel }); }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deleteReel(reel._id)}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
