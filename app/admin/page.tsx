'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err: any) => {
        toast.error(err.response?.data?.message || 'Failed to load dashboard stats');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
      </div>
    </div>
  );

  const cards = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '📦', color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: '💰', color: 'from-green-500 to-emerald-500' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'from-purple-500 to-pink-500' },
    { label: 'Avg Order Value', value: formatPrice(stats?.totalOrders ? (stats?.totalRevenue / stats?.totalOrders) : 0), icon: '📈', color: 'from-orange-500 to-rose-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white`}>
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm opacity-80 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart (simple) */}
      {stats?.monthlyRevenue?.length > 0 && (
        <div className="bg-white rounded-2xl border p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-4">Monthly Revenue</h2>
          <div className="flex items-end gap-2 h-32">
            {[...stats.monthlyRevenue].reverse().slice(-6).map((m: any, i: number) => {
              const maxRev = Math.max(...stats.monthlyRevenue.map((r: any) => r.revenue));
              const height = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{formatPrice(m.revenue)}</span>
                  <div className="w-full bg-pink-500 rounded-t-lg" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-xs text-gray-400">{m._id.month}/{m._id.year.toString().slice(-2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-pink-600 hover:text-pink-700 font-medium">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.recentOrders?.map((order: any) => (
                <tr key={order._id}>
                  <td className="py-3 font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</td>
                  <td className="py-3">{order.user?.name || '—'}</td>
                  <td className="py-3 font-medium">{formatPrice(order.totalPrice)}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getOrderStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { href: '/admin/products', icon: '➕', label: 'Add Product' },
          { href: '/admin/coupons', icon: '🎟️', label: 'Create Coupon' },
          { href: '/admin/mystery-boxes', icon: '🎁', label: 'Manage Boxes' },
          { href: '/admin/reels', icon: '🎬', label: 'Manage Reels' },
          { href: '/admin/users', icon: '👥', label: 'Manage Users' },
        ].map((action) => (
          <Link key={action.href} href={action.href}
            className="bg-white border rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all text-sm font-medium text-gray-700 hover:text-pink-600">
            <span className="text-2xl">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
