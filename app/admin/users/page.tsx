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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="w-full max-w-md border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Wallet</th>
                <th className="px-4 py-3 font-medium">Referral Code</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.phone || '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(user.wallet || 0)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-purple-600">{user.referralCode}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleBlock(user._id, user.name, user.isBlocked)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${user.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
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
          <div className="flex justify-center gap-2 p-4">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${page === i + 1 ? 'bg-pink-500 text-white' : 'bg-white border hover:bg-pink-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
