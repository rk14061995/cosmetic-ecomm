'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  AdminPageHeader,
  adminInput,
  adminLabel,
  adminPanel,
  adminStack,
  btnPrimary,
  btnSecondary,
} from '@/components/admin/ui';
import type { Reel, ApiError } from '@/types/api';

const EMPTY_FORM = { title: '', creator: '', image: '', ctaLink: '/mystery-boxes', section: 'mystery-boxes', isActive: true, sortOrder: 0 };
type ReelForm = typeof EMPTY_FORM;

export default function AdminReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ReelForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Reel | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchReels = () => {
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
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to save reel');
    } finally { setSaving(false); }
  };

  const deleteReel = async (id: string) => {
    if (!confirm('Delete this reel?')) return;
    try { await api.delete(`/reels/${id}`); toast.success('Reel deleted'); fetchReels(); }
    catch (err) { toast.error((err as ApiError).response?.data?.message || 'Failed to delete reel'); }
  };

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Unboxing reels"
        description="Manage social proof reels shown on the homepage and mystery box funnel."
      />

      <div className={`${adminPanel} p-6`}>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">{editing ? 'Edit reel' : 'Add new reel'}</h2>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={adminLabel}>Reel title *</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Unboxing Premium Box" required className={adminInput} />
          </div>
          <div>
            <label className={adminLabel}>Creator handle *</label>
            <input value={form.creator} onChange={(e) => setForm((p) => ({ ...p, creator: e.target.value }))}
              placeholder="@riya.beauty" required className={adminInput} />
          </div>
          <div className="md:col-span-2">
            <label className={adminLabel}>Image URL *</label>
            <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              placeholder="https://res.cloudinary.com/…" required className={adminInput} />
          </div>
          <div>
            <label className={adminLabel}>CTA link</label>
            <input value={form.ctaLink} onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
              placeholder="/mystery-boxes" className={adminInput} />
          </div>
          <div>
            <label className={adminLabel}>Sort order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
              className={adminInput} />
          </div>
          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="accent-indigo-600" />
              Active (visible on homepage)
            </label>
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? 'Saving…' : editing ? 'Update reel' : 'Add reel'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className={btnSecondary}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`${adminPanel} overflow-hidden`}>
        <div className="border-b border-slate-200/90 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Existing reels</h2>
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
                  <p className="mt-1 max-w-sm truncate text-xs text-indigo-600">{reel.image}</p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => { setEditing(reel); setForm({ title: reel.title, creator: reel.creator, image: reel.image, ctaLink: reel.ctaLink || '/mystery-boxes', section: reel.section || 'mystery-boxes', isActive: reel.isActive, sortOrder: reel.sortOrder }); }}
                    className={`${btnSecondary} px-3 py-1.5 text-xs`}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteReel(reel._id)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 shadow-sm transition hover:bg-rose-100">
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
