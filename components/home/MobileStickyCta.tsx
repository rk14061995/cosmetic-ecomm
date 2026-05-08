'use client';
import Link from 'next/link';

export default function MobileStickyCta() {
  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 md:hidden">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur border border-indigo-100 rounded-2xl shadow-lg p-2 flex items-center gap-2">
        <Link
          href="/products"
          className="flex-1 text-center bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-semibold py-2.5 rounded-xl"
        >
          Shop Now
        </Link>
        <Link
          href="/quiz"
          className="flex-1 text-center border border-indigo-200 text-indigo-700 text-sm font-semibold py-2.5 rounded-xl"
        >
          Take Quiz
        </Link>
      </div>
    </div>
  );
}
