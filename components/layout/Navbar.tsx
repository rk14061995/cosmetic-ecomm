'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

const normalizeEmail = (email?: string) => (email || '').trim().toLowerCase();
const STATIC_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_STATIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => normalizeEmail(email))
  .filter(Boolean);

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

export default function Navbar() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);
  const { cartCount } = useSelector((state: any) => state.cart);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasAdminAccess =
    !!user &&
    (user.role === 'admin' || STATIC_ADMIN_EMAILS.includes(normalizeEmail(user.email)));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    router.push('/');
    setMenuOpen(false);
  };

  const navLinkClass =
    'rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100/90 hover:text-gray-900 transition-colors';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/85 backdrop-blur-md shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-4 h-[4.25rem]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-xl pr-1 -ml-1 pl-1 py-1 hover:bg-gray-50/80 transition-colors"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white shadow-md shadow-indigo-500/20"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
              }}
              aria-hidden
            >
              K
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-gray-900">KosmeticX</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-pink-600 mt-0.5">
                Beauty & care
              </span>
            </span>
            <span className="sm:hidden text-lg font-black tracking-tight text-gray-900">KX</span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 justify-center max-w-xl mx-2">
            <div className="relative w-full group">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories…"
                className="w-full pl-11 pr-4 py-2.5 rounded-full text-sm bg-gray-100/80 border border-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-400/35 transition-all"
                aria-label="Search products"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </span>
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 shrink-0" aria-label="Main">
            <Link href="/products" className={navLinkClass}>
              Shop
            </Link>
            <Link href="/mystery-boxes" className={navLinkClass}>
              Mystery Box
            </Link>
            <Link
              href="/sale"
              className="ml-1 flex items-center gap-1.5 rounded-full bg-red-50 text-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide border border-red-100 hover:bg-red-100/80 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              Sale
            </Link>
            <Link href="/blog" className={navLinkClass}>
              Blog
            </Link>
            <Link href="/bundles" className={navLinkClass}>
              Bundles
            </Link>
            <Link
              href="/quiz"
              className="ml-1 text-sm font-semibold rounded-full bg-pink-100 text-pink-700 border border-pink-200 px-3 py-1.5 hover:bg-pink-200/80 transition-colors"
            >
              Quiz
            </Link>
          </nav>

          {/* Tablet: compact links */}
          <nav className="hidden md:flex lg:hidden items-center gap-0.5 shrink-0 text-xs" aria-label="Main short">
            <Link href="/products" className={`${navLinkClass} px-2 py-1.5`}>
              Shop
            </Link>
            <Link href="/sale" className="rounded-full bg-red-50 text-red-600 px-2 py-1 font-bold border border-red-100">
              Sale
            </Link>
            <Link href="/quiz" className="rounded-full bg-pink-100 text-pink-700 px-2 py-1 font-semibold border border-pink-200">
              Quiz
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 hover:text-pink-600 transition-colors"
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <CartIcon className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold tabular-nums">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group hidden sm:block">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 hover:bg-gray-100 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={undefined}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 ring-2 ring-white shadow-sm flex items-center justify-center text-pink-700 font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </button>
                <div
                  className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50"
                  role="menu"
                >
                  <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xl shadow-gray-900/10 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50">
                      My profile
                    </Link>
                    <Link href="/profile/orders" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50">
                      Orders
                    </Link>
                    <Link href="/profile/wishlist" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50">
                      Wishlist
                    </Link>
                    {hasAdminAccess && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 font-medium"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center justify-center rounded-full bg-pink-500 text-white text-sm font-semibold px-5 py-2 shadow-sm hover:bg-pink-600 transition-colors"
              >
                Log in
              </Link>
            )}

            <button
              type="button"
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-md max-h-[min(85vh,calc(100dvh-4.25rem))] overflow-y-auto"
        >
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300"
                  aria-label="Search products"
                />
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-pink-500 text-white px-4 py-2 text-sm font-semibold hover:bg-pink-600 transition-colors"
              >
                Go
              </button>
            </form>

            <nav className="grid gap-1" aria-label="Mobile main">
              <Link
                href="/products"
                className="rounded-xl px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Shop all
              </Link>
              <Link
                href="/mystery-boxes"
                className="rounded-xl px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Mystery boxes
              </Link>
              <Link
                href="/sale"
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-red-600 bg-red-50/80 border border-red-100"
                onClick={() => setMenuOpen(false)}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                </span>
                Flash sale
              </Link>
              <Link
                href="/blog"
                className="rounded-xl px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/bundles"
                className="rounded-xl px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                Bundles
              </Link>
              <Link
                href="/quiz"
                className="rounded-xl px-3 py-3 text-sm font-semibold text-pink-700 bg-pink-50 border border-pink-100"
                onClick={() => setMenuOpen(false)}
              >
                Skin quiz
              </Link>
            </nav>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/cart"
                className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <CartIcon className="w-5 h-5" />
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/profile/orders"
                    className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {hasAdminAccess && (
                    <Link
                      href="/admin"
                      className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl border border-purple-200 bg-purple-50 py-2.5 text-sm font-semibold text-purple-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl bg-pink-500 text-white py-2.5 text-sm font-semibold hover:bg-pink-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Log in / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
