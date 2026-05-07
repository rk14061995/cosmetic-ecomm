'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '@/store/slices/authSlice';
import { fetchCart } from '@/store/slices/cartSlice';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<any>();
  const { loading } = useSelector((state: any) => state.auth);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const result = await dispatch(registerUser(form as any));
    if (registerUser.fulfilled.match(result)) {
      dispatch(fetchCart());
      toast.success(`Welcome to GlowBox, ${result.payload.user.name}! 🎉`);
      router.push('/');
    } else {
      toast.error(result.payload as string || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            GlowBox
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of beauty lovers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required placeholder="Jane Doe"
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required placeholder="you@example.com"
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="9876543210"
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required minLength={6} placeholder="Minimum 6 characters"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 pr-12" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral Code (optional)</label>
            <input type="text" value={form.referralCode}
              onChange={(e) => setForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
              placeholder="Enter referral code"
              className="w-full border rounded-xl px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-pink-400" />
            {form.referralCode && <p className="text-xs text-green-600 mt-1">✓ You'll get ₹50 off your first order!</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-pink-600 font-semibold hover:text-pink-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
