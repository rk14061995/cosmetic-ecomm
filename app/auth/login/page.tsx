'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginUser } from '@/store/slices/authSlice';
import { fetchCart } from '@/store/slices/cartSlice';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<any>();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(loginUser(form as any));
    if (loginUser.fulfilled.match(result)) {
      dispatch(fetchCart());
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } else {
      toast.error(result.payload as string || 'Login failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-indigo-700 tracking-tight">
            Glowzy
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
              placeholder="you@example.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-12"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
