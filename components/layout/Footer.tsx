import Link from 'next/link';
import { getSiteName } from '@/lib/seo';

type SocialLink = {
  label: string;
  url: string;
};

function socialLabelFromUrl(url: string) {
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'Instagram';
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'Facebook';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('x.com') || u.includes('twitter.com')) return 'X';
  if (u.includes('linkedin.com')) return 'LinkedIn';
  return 'Social';
}

export default function Footer() {
  const siteName = getSiteName();
  const socialLinks: SocialLink[] = (process.env.NEXT_PUBLIC_SOCIAL_PROFILES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url) => ({ label: socialLabelFromUrl(url), url }));

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              {siteName}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop destination for premium cosmetics, skincare, and mystery beauty boxes.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              {['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Body Care'].map((cat) => (
                <li key={cat}>
                  <Link href={`/products?category=${cat}`} className="hover:text-pink-400 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
              <li><Link href="/mystery-boxes" className="hover:text-pink-400 transition-colors">Mystery Boxes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/login" className="hover:text-pink-400 transition-colors">Login</Link></li>
              <li><Link href="/auth/register" className="hover:text-pink-400 transition-colors">Register</Link></li>
              <li><Link href="/profile/orders" className="hover:text-pink-400 transition-colors">My Orders</Link></li>
              <li><Link href="/profile/wishlist" className="hover:text-pink-400 transition-colors">Wishlist</Link></li>
              <li><Link href="/profile" className="hover:text-pink-400 transition-colors">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shipping-policy" className="hover:text-pink-400 transition-colors">Shipping Policy</Link></li>
              <li><Link href="/return-policy" className="hover:text-pink-400 transition-colors">Return Policy</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-pink-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-pink-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-pink-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="border-t border-gray-800 mt-10 pt-6">
            <h4 className="text-white font-semibold mb-3">Follow Us</h4>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:border-pink-400 hover:text-pink-300 transition-colors"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-[10px]">
                    {social.label.charAt(0)}
                  </span>
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Secure payments by</span>
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
