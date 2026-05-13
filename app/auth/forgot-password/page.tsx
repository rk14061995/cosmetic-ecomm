'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getSiteName } from '@/lib/seo';

export default function ForgotPasswordPage() {
  const siteName = getSiteName();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-indigo-700 tracking-tight">{siteName}</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">{sent ? 'Check your email' : 'Forgot Password'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sent ? `We've sent a reset link to ${email}` : 'Enter your email and we\'ll send a reset link'}
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-sm text-gray-600 mb-6">Didn't receive it? Check your spam folder or try again.</p>
            <button onClick={() => setSent(false)} className="text-indigo-600 font-medium text-sm hover:text-indigo-700">Try again</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/auth/login" className="text-indigo-600 font-semibold hover:text-indigo-700">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
