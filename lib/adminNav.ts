/** Admin sidebar: single source of truth. `icon` maps to glyphs in `AdminShell`. */
export const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' as const },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' as const },
  { href: '/admin/products', label: 'Products', icon: 'products' as const },
  { href: '/admin/users', label: 'Users', icon: 'users' as const },
  { href: '/admin/coupons', label: 'Coupons', icon: 'coupons' as const },
  { href: '/admin/marketing-links', label: 'Acquisition links', icon: 'marketing' as const },
  { href: '/admin/mystery-boxes', label: 'Mystery boxes', icon: 'gift' as const },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' as const },
  { href: '/admin/reels', label: 'Reels', icon: 'reels' as const },
] as const;

export type AdminNavIconId = (typeof ADMIN_NAV_LINKS)[number]['icon'];
