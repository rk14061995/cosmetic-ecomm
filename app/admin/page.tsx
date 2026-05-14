'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';
import { formatOrderLabelForDisplay } from '@/lib/orderDisplay';
import toast from 'react-hot-toast';
import { AdminPageHeader, adminPanel, adminStack, adminTableHead, btnSecondary } from '@/components/admin/ui';
import type { AdminStats, MonthlyRevenue, Order, ApiError } from '@/types/api';

const statCards = (stats: AdminStats | null) => [
  {
    label: 'Total orders',
    value: stats?.totalOrders ?? 0,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974a1.125 1.125 0 011.119 1.007z" />
      </svg>
    ),
  },
  {
    label: 'Net revenue',
    value: formatPrice(stats?.totalRevenue ?? 0),
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-3.75h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Customers',
    value: stats?.totalUsers ?? 0,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
      </svg>
    ),
  },
  {
    label: 'Avg. order value',
    value: formatPrice(stats?.totalOrders ? stats.totalRevenue / stats.totalOrders : 0),
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

const quickActions = [
  { href: '/admin/products', label: 'New product', sub: 'Add a catalog listing' },
  { href: '/admin/coupons', label: 'New coupon', sub: 'Discounts & campaigns' },
  { href: '/admin/mystery-boxes', label: 'Mystery boxes', sub: 'Tiers & inventory' },
  { href: '/admin/orders', label: 'Orders queue', sub: 'Fulfillment & status' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch((err: unknown) => toast.error((err as ApiError).response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`${adminStack} animate-pulse`}>
        <div className="h-10 w-56 rounded-lg bg-indigo-200/50" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${adminPanel} h-32`} />
          ))}
        </div>
        <div className={`${adminPanel} h-72`} />
      </div>
    );
  }

  const cards = statCards(stats);

  return (
    <div className={adminStack}>
      <AdminPageHeader
        title="Overview"
        description="High-level performance for your storefront. Figures reflect paid and fulfilled commerce activity."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {cards.map((card) => (
          <div key={card.label} className={`${adminPanel} p-5 transition hover:border-indigo-300/80 hover:shadow-md hover:shadow-indigo-950/10`}>
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-indigo-100/90 p-2 text-indigo-700">{card.icon}</div>
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight text-indigo-950 sm:text-3xl">{card.value}</p>
            <p className="mt-1 text-sm text-indigo-950/55">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${adminPanel} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-semibold text-indigo-950">Revenue by month</h2>
          <p className="mt-0.5 text-xs text-indigo-950/50">Trailing window from your latest recorded months</p>
          {(stats?.monthlyRevenue?.length ?? 0) > 0 ? (
            <div className="mt-8 flex h-44 items-end gap-2 sm:gap-3">
              {[...stats!.monthlyRevenue].reverse().slice(-6).map((m: MonthlyRevenue, i: number) => {
                const maxRev = Math.max(...stats!.monthlyRevenue.map((r: MonthlyRevenue) => r.revenue), 1);
                const height = Math.max((m.revenue / maxRev) * 100, 5);
                return (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-medium text-indigo-950/45 opacity-0 transition group-hover:opacity-100">
                      {formatPrice(m.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-indigo-200/70 transition group-hover:bg-indigo-600"
                      style={{ height: `${height}%`, minHeight: '0.5rem' }}
                    />
                    <span className="text-[10px] font-medium tabular-nums text-indigo-950/50">
                      {m._id.month}/{String(m._id.year).slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 flex h-44 items-center justify-center rounded-lg border border-dashed border-indigo-200/80 bg-indigo-50/40 text-sm text-indigo-950/50">
              No revenue history yet
            </div>
          )}
        </div>

        <div className={`${adminPanel} flex flex-col`}>
          <div className="border-b border-indigo-100/80 px-5 py-4">
            <h2 className="text-sm font-semibold text-indigo-950">Shortcuts</h2>
            <p className="text-xs text-indigo-950/50">Frequent admin tasks</p>
          </div>
          <div className="divide-y divide-indigo-100/70">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-indigo-50/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100/80 text-indigo-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-indigo-950">{action.label}</span>
                  <span className="block text-xs text-indigo-950/50">{action.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={adminPanel}>
        <div className="flex items-center justify-between border-b border-indigo-100/80 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-indigo-950">Recent orders</h2>
            <p className="text-xs text-indigo-950/50">Latest activity across the store</p>
          </div>
          <Link href="/admin/orders" className={`${btnSecondary} px-3 py-2 text-xs`}>
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
                <th className="px-5 py-3 sm:px-6">Order</th>
                <th className="px-5 py-3 sm:px-6">Customer</th>
                <th className="px-5 py-3 sm:px-6">Amount</th>
                <th className="px-5 py-3 sm:px-6">Status</th>
                <th className="px-5 py-3 sm:px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100/60">
              {(stats?.recentOrders?.length ?? 0) > 0 ? (
                stats!.recentOrders.map((order: Order) => (
                  <tr key={order._id} className="transition hover:bg-indigo-50/50">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800 sm:px-6">
                      {formatOrderLabelForDisplay(order)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800 sm:px-6">{order.user?.name || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900 sm:px-6">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusColor(order.orderStatus)}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 sm:px-6">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-sm text-indigo-950/45">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
