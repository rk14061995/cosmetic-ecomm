'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AdminPageHeader, adminPanel, adminStack, adminTableHead, adminInput, btnSecondary } from '@/components/admin/ui';
import type { User, Pagination } from '@/types/api';

type AcqStat = { source: string; count: number };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [acqStats, setAcqStats] = useState<AcqStat[]>([]);

  const fetchUsers = () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.append('search', search);
    api.get(`/users?${params}`)
      .then(({ data }) => { setUsers(data.users || []); setPagination(data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api
      .get('/users/acquisition-stats')
      .then(({ data }) => setAcqStats(data.stats || []))
      .catch(() => setAcqStats([]));
  }, []);

  const toggleBlock = async (userId: string, name: string, isBlocked: boolean) => {
    if (!confirm(`${isBlocked ? 'Unblock' : 'Block'} user "${name}"?`)) return;
    try {
      const { data } = await api.put(`/users/${userId}/block`);
      toast.success(data.message);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Customers"
        description="Accounts, wallet balances, referral codes, and acquisition source for each signup."
      />

      {acqStats.length > 0 && (
        <div className={`${adminPanel} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-slate-900">Acquisition</h2>
          <p className="mt-0.5 text-xs text-slate-500">Signups grouped by first-touch campaign parameter</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {acqStats.map((row) => (
              <span
                key={row.source}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <span className="capitalize text-slate-600">{row.source}</span>
                <span className="tabular-nums font-semibold text-slate-900">{row.count}</span>
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Share the <span className="font-medium text-slate-700">acquisition</span> URL from{' '}
            <Link href="/admin/marketing-links" className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900">
              Acquisition links
            </Link>{' '}
            (or any URL with{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-700">?utm_source=…</code> or{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-700">?from=…</code>). Do not use{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-700">ref</code> — reserved for referral codes.
          </p>
        </div>
      )}

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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className={`${adminInput} pl-10`}
          />
        </div>
      </div>

      <div className={`${adminPanel} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Wallet</th>
                <th className="px-5 py-3">Referral Code</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-5 py-3">
                    <div className="h-4 bg-slate-100 animate-pulse rounded-lg" />
                  </td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-slate-400">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="transition-colors hover:bg-slate-50/90">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold capitalize text-slate-600">
                        {user.acquisitionSource?.trim() ? user.acquisitionSource : 'direct'}
                      </span>
                      {user.acquisitionMedium?.trim() ? (
                        <p className="text-[10px] text-slate-400 mt-0.5">{user.acquisitionMedium}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">{user.phone || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{formatPrice(user.wallet || 0)}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">{user.referralCode}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleBlock(user._id, user.name, user.isBlocked ?? false)}
                        className={`${btnSecondary} px-3 py-1.5 text-xs ${
                          user.isBlocked ? 'border-emerald-200 text-emerald-800 hover:bg-emerald-50' : 'border-rose-200 text-rose-800 hover:bg-rose-50'
                        }`}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Page {page} of {pagination.totalPages}</p>
            <div className="flex gap-1">
              {[...Array(Math.min(pagination.totalPages, 8))].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === i + 1 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
