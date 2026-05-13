'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { buildAcquisitionShareUrl, MARKETING_CHANNELS, type MarketingChannel } from '@/lib/marketingAcquisitionUrl';
import {
  AdminModal,
  AdminPageHeader,
  adminInput,
  adminLabel,
  adminPanel,
  adminStack,
  adminTableHead,
  btnAccent,
  btnPrimary,
  btnSecondary,
  filterPill,
} from '@/components/admin/ui';

const CHANNEL_LABELS: Record<MarketingChannel, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  google_ads: 'Google Ads',
  web: 'Web / organic',
  other: 'Other',
};

const CHANNEL_BADGE: Record<MarketingChannel, string> = {
  instagram: 'bg-pink-100 text-pink-800',
  whatsapp: 'bg-emerald-100 text-emerald-900',
  google_ads: 'bg-amber-100 text-amber-900',
  web: 'bg-sky-100 text-sky-900',
  other: 'bg-slate-200 text-slate-800',
};

const EMPTY_FORM = {
  channel: 'instagram' as MarketingChannel,
  label: '',
  url: '',
  notes: '',
  isActive: true,
  sortOrder: 0,
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Could not copy');
  }
}

export default function AdminMarketingLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<MarketingChannel | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchLinks = useCallback(() => {
    setLoading(true);
    const q = channelFilter === 'all' ? '' : `?channel=${channelFilter}`;
    api
      .get(`/marketing-links${q}`)
      .then(({ data }) => setLinks(data.links || []))
      .catch(() => toast.error('Failed to load links'))
      .finally(() => setLoading(false));
  }, [channelFilter]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const filteredCount = useMemo(() => links.length, [links]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      channel: row.channel,
      label: row.label,
      url: row.url,
      notes: row.notes || '',
      isActive: row.isActive !== false,
      sortOrder: row.sortOrder ?? 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) {
        await api.put(`/marketing-links/${editing._id}`, payload);
        toast.success('Link updated');
      } else {
        await api.post('/marketing-links', payload);
        toast.success('Link created');
      }
      setShowForm(false);
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete “${label}”?`)) return;
    try {
      await api.delete(`/marketing-links/${id}`);
      toast.success('Deleted');
      fetchLinks();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (row: any) => {
    try {
      await api.put(`/marketing-links/${row._id}`, { isActive: !row.isActive });
      fetchLinks();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Acquisition links"
        description="Landing URLs for Instagram, WhatsApp, Google Ads, and the web. Use the acquisition link when sharing so first-touch signup attribution is captured (see Customers → acquisition)."
        actions={
          <button type="button" onClick={openCreate} className={btnAccent}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add link
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-indigo-950/50">Channel</span>
        <button type="button" className={filterPill(channelFilter === 'all')} onClick={() => setChannelFilter('all')}>
          All
        </button>
        {MARKETING_CHANNELS.map((ch) => (
          <button key={ch} type="button" className={filterPill(channelFilter === ch)} onClick={() => setChannelFilter(ch)}>
            {CHANNEL_LABELS[ch]}
          </button>
        ))}
        <span className="ml-auto text-xs text-indigo-950/45">{filteredCount} link{filteredCount !== 1 ? 's' : ''}</span>
      </div>

      <div className={`${adminPanel} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
                <th className="px-5 py-3">Label</th>
                <th className="px-5 py-3">Channel</th>
                <th className="min-w-[220px] px-5 py-3">Acquisition link</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100/50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="h-4 animate-pulse rounded-lg bg-indigo-100/40" />
                    </td>
                  </tr>
                ))
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-indigo-950/45">
                    No links yet. Add tracking or landing URLs for each channel.
                  </td>
                </tr>
              ) : (
                links.map((row) => {
                  const acq = row.acquisitionUrl || buildAcquisitionShareUrl(row.url, row.channel, row.label);
                  return (
                  <tr key={row._id} className="transition hover:bg-indigo-50/40">
                    <td className="px-5 py-4">
                      <p className="font-medium text-indigo-950">{row.label}</p>
                      {row.notes ? <p className="mt-0.5 line-clamp-2 text-xs text-indigo-950/45">{row.notes}</p> : null}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_BADGE[row.channel as MarketingChannel] || 'bg-slate-200 text-slate-800'}`}
                      >
                        {CHANNEL_LABELS[row.channel as MarketingChannel] || row.channel}
                      </span>
                    </td>
                    <td className="max-w-md px-5 py-4">
                      <p className="break-all font-mono text-xs text-indigo-950" title={acq}>
                        {acq.slice(0, 96)}
                        {acq.length > 96 ? '…' : ''}
                      </p>
                      <p className="mt-1 break-all text-[10px] text-indigo-950/40">Stored: {row.url}</p>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-indigo-950/70">{row.sortOrder ?? 0}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          row.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {row.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => copyText(acq)} className={`${btnPrimary} px-3 py-1.5 text-xs`}>
                          Copy acquisition
                        </button>
                        <button type="button" onClick={() => copyText(row.url)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
                          Copy stored URL
                        </button>
                        <button type="button" onClick={() => openEdit(row)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row._id, row.label)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 shadow-sm transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${adminPanel} p-5`}>
        <p className="text-sm font-medium text-indigo-950">Public API (read-only)</p>
        <p className="mt-1 text-xs text-indigo-950/50">
          Active links: <span className="font-mono text-indigo-800">GET /api/marketing-links/public</span> — each item includes{' '}
          <span className="font-mono">url</span> and <span className="font-mono">acquisitionUrl</span> (UTMs added only when missing).
          Optional <span className="font-mono">?channel=instagram</span>.
        </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <AdminModal className="max-w-lg">
            <h3 className="mb-1 text-lg font-semibold text-indigo-950">{editing ? 'Edit link' : 'Add acquisition link'}</h3>
            <p className="mb-6 text-sm text-indigo-950/50">
              Base URL with <span className="font-mono">https://</span>. We append <span className="font-mono">utm_source</span>,{' '}
              <span className="font-mono">utm_medium</span>, and <span className="font-mono">utm_campaign</span> only if they are missing — so
              existing tracking is never overwritten.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={adminLabel}>Channel *</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as MarketingChannel }))}
                  className={adminInput}
                >
                  {MARKETING_CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {CHANNEL_LABELS[ch]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={adminLabel}>Label *</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  required
                  placeholder="e.g. Diwali sale — Instagram story"
                  className={adminInput}
                />
              </div>
              <div>
                <label className={adminLabel}>URL *</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  required
                  placeholder="https://yoursite.com/sale"
                  className={adminInput}
                />
                {form.url.trim().startsWith('http') ? (
                  <p className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2 text-[11px] leading-snug text-indigo-950/70">
                    <span className="font-semibold text-indigo-900">Preview (acquisition):</span>{' '}
                    <span className="break-all font-mono text-indigo-950/80">
                      {buildAcquisitionShareUrl(form.url, form.channel, form.label)}
                    </span>
                  </p>
                ) : null}
              </div>
              <div>
                <label className={adminLabel}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Internal reminder: which creative or ad group"
                  className={`${adminInput} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={adminLabel}>Sort order</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                    className={adminInput}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-indigo-950/80">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="accent-indigo-600"
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className={`${btnSecondary} flex-1`}>
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
