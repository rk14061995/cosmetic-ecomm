'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';

export default function Navbar() {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);
  const { cartCount } = useSelector((state: any) => state.cart);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              GlowBox
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cosmetics..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            {/* Core links */}
            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors">
              Shop
            </Link>
            <Link href="/mystery-boxes" className="text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors">
              🎁 Mystery Box
            </Link>

            {/* Flash Sale — stands out */}
            <Link href="/sale" className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Flash Sale ⚡
            </Link>

            <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors">
              Blog
            </Link>
            <Link href="/bundles" className="text-sm font-medium text-gray-700 hover:text-pink-500 transition-colors">
              Bundles
            </Link>

            {/* Quiz pill */}
            <Link
              href="/quiz"
              className="text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-full hover:shadow-md hover:scale-105 transition-all"
            >
              ✨ Take Quiz
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-pink-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-pink-50">My Profile</Link>
                  <Link href="/profile/orders" className="block px-4 py-2 text-sm hover:bg-pink-50">Orders</Link>
                  <Link href="/profile/wishlist" className="block px-4 py-2 text-sm hover:bg-pink-50">Wishlist</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50">Admin Panel</Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="bg-pink-500 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-pink-600 transition-colors">
                Login
              </Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-1">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button type="submit" className="bg-pink-500 text-white px-3 py-2 rounded-lg text-sm">Go</button>
          </form>

          {/* Mobile nav links */}
          <Link href="/products"      className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link href="/mystery-boxes" className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>🎁 Mystery Box</Link>

          {/* Flash Sale — mobile */}
          <Link href="/sale" className="flex items-center gap-2 text-sm font-bold text-red-600 py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Flash Sale ⚡
          </Link>

          <Link href="/blog"    className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Blog</Link>
          <Link href="/bundles" className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Bundles</Link>

          {/* Quiz pill — mobile */}
          <div className="py-2.5 border-b border-gray-50">
            <Link
              href="/quiz"
              onClick={() => setMenuOpen(false)}
              className="inline-block text-sm font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1.5 rounded-full"
            >
              ✨ Take Quiz
            </Link>
          </div>

          <Link href="/cart" className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>

          {user ? (
            <>
              <Link href="/profile"        className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/profile/orders" className="block text-sm font-medium py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Orders</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="block text-sm font-medium text-purple-600 py-2.5 border-b border-gray-50" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
              )}
              <button onClick={handleLogout} className="block text-sm font-medium text-red-600 py-2.5 w-full text-left">Logout</button>
            </>
          ) : (
            <Link href="/auth/login" className="block text-sm font-medium text-pink-600 py-2.5" onClick={() => setMenuOpen(false)}>Login / Register</Link>
          )}
        </div>
      )}
    </header>
  );
}
