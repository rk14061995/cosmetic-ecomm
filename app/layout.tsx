import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import { Toaster } from 'react-hot-toast';
import {
  DEFAULT_DESCRIPTION,
  KEYWORDS,
  buildVerification,
  defaultOpenGraph,
  defaultTwitter,
  getSiteName,
  getSiteUrl,
} from '@/lib/seo';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = getSiteUrl();
const siteName = getSiteName();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — K-Beauty, Skincare & Cosmetics`,
    template: `%s | ${siteName}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: siteName,
  keywords: KEYWORDS,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: defaultOpenGraph(),
  twitter: defaultTwitter(),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  verification: buildVerification(),
  category: 'beauty',
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <OrganizationJsonLd />
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <ConditionalFooter />
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
