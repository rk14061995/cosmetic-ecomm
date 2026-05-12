'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

const statCards = (stats: any) => [
  {
    label: 'Total Orders',
    value: stats?.totalOrders ?? 0,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'border-l-blue-500',
  },
  {
    label: 'Total Revenue',
    value: formatPrice(stats?.totalRevenue ?? 0),
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'border-l-emerald-500',
  },
  {
    label: 'Total Users',
    value: stats?.totalUsers ?? 0,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    border: 'border-l-violet-500',
  },
  {
    label: 'Avg Order Value',
    value: formatPrice(stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders) : 0),
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-l-amber-500',
  },
];

const quickActions = [
  {
    href: '/admin/products',
    label: 'Add Product',
    sub: 'Create new listing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
    color: 'text-violet-600 bg-violet-50',
  },
  {
    href: '/admin/coupons',
    label: 'Create Coupon',
    sub: 'Set up discount code',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z" />
        <circle cx="6" cy="9" r="0.5" fill="currentColor" />
      </svg>
    ),
    color: 'text-pink-600 bg-pink-50',
  },
  {
    href: '/admin/mystery-boxes',
    label: 'Manage Boxes',
    sub: 'Edit mystery box tiers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
      </svg>
    ),
    color: 'text-amber-600 bg-amber-50',
  },
  {
    href: '/admin/orders',
    label: 'View Orders',
    sub: 'Process & ship orders',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    color: 'text-blue-600 bg-blue-50',
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-lg w-48 mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm border border-slate-100" />)}
      </div>
      <div className="h-64 bg-white rounded-2xl shadow-sm border border-slate-100" />
    </div>
  );

  const cards = statCards(stats);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back — here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div key={card.label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 border-l-4 ${card.border}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${card.bg} ${card.iconColor}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Monthly Revenue</h2>
          <p className="text-xs text-slate-400 mb-6">Last 6 months</p>
          {stats?.monthlyRevenue?.length > 0 ? (
            <div className="flex items-end gap-3 h-40">
              {[...stats.monthlyRevenue].reverse().slice(-6).map((m: any, i: number) => {
                const maxRev = Math.max(...stats.monthlyRevenue.map((r: any) => r.revenue), 1);
                const height = Math.max((m.revenue / maxRev) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      {formatPrice(m.revenue)}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all hover:from-pink-500 hover:to-pink-400 cursor-default"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {m._id.month}/{m._id.year.toString().slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 group-hover:text-violet-600 transition-colors">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.sub}</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 ml-auto group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
            View all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-50">
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats?.recentOrders?.length > 0 ? stats.recentOrders.map((order: any) => (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{order._id.slice(-8).toUpperCase()}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{order.user?.name || '—'}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatPrice(order.totalPrice)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getOrderStatusColor(order.orderStatus)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(order.createdAt)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
