import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'GlowBox Cosmetics — Premium Beauty & Skincare',
    template: '%s | GlowBox Cosmetics',
  },
  description: 'Discover premium cosmetics, skincare, and mystery beauty boxes. Shop the best brands at unbeatable prices.',
  keywords: ['cosmetics', 'skincare', 'makeup', 'haircare', 'beauty', 'mystery box'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'GlowBox Cosmetics',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#333', color: '#fff', fontSize: '14px' },
              success: { style: { background: '#166534', color: '#fff' } },
              error: { style: { background: '#991b1b', color: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
