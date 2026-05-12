'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  const fetchUsers = () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.append('search', search);
    api.get(`/users?${params}`)
      .then(({ data }) => { setUsers(data.users || []); setPagination(data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, page]);

  const toggleBlock = async (userId: string, name: string, isBlocked: boolean) => {
    if (!confirm(`${isBlocked ? 'Unblock' : 'Block'} user "${name}"?`)) return;
    try {
      const { data } = await api.put(`/users/${userId}/block`);
      toast.success(data.message);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Manage customer accounts and access</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3">User</th>
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
                  <tr key={i}><td colSpan={7} className="px-5 py-3">
                    <div className="h-4 bg-slate-100 animate-pulse rounded-lg" />
                  </td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
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
                      <button onClick={() => toggleBlock(user._id, user.name, user.isBlocked)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${user.isBlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
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
