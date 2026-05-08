'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  title: '',
  creator: '',
  image: '',
  ctaLink: '/mystery-boxes',
  section: 'mystery-boxes',
  isActive: true,
  sortOrder: 0,
};

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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?._id) {
        await api.put(`/reels/${editing._id}`, form);
        toast.success('Reel updated');
      } else {
        await api.post('/reels', form);
        toast.success('Reel created');
      }
      fetchReels();
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save reel');
    } finally {
      setSaving(false);
    }
  };

  const deleteReel = async (id: string) => {
    if (!confirm('Delete this reel?')) return;
    try {
      await api.delete(`/reels/${id}`);
      toast.success('Reel deleted');
      fetchReels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete reel');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unboxing Reels</h1>
        <p className="text-sm text-gray-500 mt-1">Manage mystery-box social proof reels shown on homepage.</p>
      </div>

      <form onSubmit={submit} className="bg-white border rounded-2xl p-5 grid md:grid-cols-2 gap-4">
        <input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
          placeholder="Reel title" required className="border rounded-xl px-3 py-2 text-sm" />
        <input value={form.creator} onChange={(e) => setForm((p: any) => ({ ...p, creator: e.target.value }))}
          placeholder="Creator handle (e.g. @riya.beauty)" required className="border rounded-xl px-3 py-2 text-sm" />
        <input value={form.image} onChange={(e) => setForm((p: any) => ({ ...p, image: e.target.value }))}
          placeholder="Image URL" required className="border rounded-xl px-3 py-2 text-sm md:col-span-2" />
        <input value={form.ctaLink} onChange={(e) => setForm((p: any) => ({ ...p, ctaLink: e.target.value }))}
          placeholder="CTA link (default /mystery-boxes)" className="border rounded-xl px-3 py-2 text-sm" />
        <input type="number" value={form.sortOrder} onChange={(e) => setForm((p: any) => ({ ...p, sortOrder: Number(e.target.value) }))}
          placeholder="Sort order" className="border rounded-xl px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
          Active
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Update Reel' : 'Add Reel'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="border px-5 py-2.5 rounded-xl hover:bg-gray-50 font-medium">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="p-4 border-b font-semibold text-gray-900">Existing Reels</div>
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading reels...</div>
        ) : reels.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No reels found.</div>
        ) : (
          <div className="divide-y">
            {reels.map((reel) => (
              <div key={reel._id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{reel.title}</p>
                  <p className="text-xs text-gray-500">{reel.creator} • order {reel.sortOrder} • {reel.isActive ? 'Active' : 'Inactive'}</p>
                  <p className="text-xs text-indigo-600 mt-1 break-all">{reel.image}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(reel); setForm({ ...reel }); }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200">
                    Edit
                  </button>
                  <button onClick={() => deleteReel(reel._id)}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200">
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
