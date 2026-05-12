import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              KosmeticX
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
              <li><a href="#" className="hover:text-pink-400 transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Return Policy</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-pink-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} KosmeticX. All rights reserved.</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Secure payments by</span>
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
