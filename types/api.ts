export interface ProductImage {
  url: string;
  publicId?: string;
}

export interface ProductVariant {
  _id: string;
  name?: string;
  value: string;
  stock?: number;
  priceModifier?: number;
}

export interface ProductReview {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  costPrice?: number;
  category: string;
  brand: string;
  stock: number;
  tags?: string[];
  ingredients?: string;
  howToUse?: string;
  weight?: string;
  slug?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  eligibleForMysteryBox?: boolean;
  virtualTryOn?: boolean;
  tryOnTintHex?: string;
  images: ProductImage[];
  ratings?: number;
  numReviews?: number;
  createdAt?: string;
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  frequentlyBoughtWith?: Product[];
}

export interface UserAddress {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  wallet: number;
  referralCode: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  isBlocked?: boolean;
  acquisitionSource?: string;
  acquisitionMedium?: string;
  addresses: UserAddress[];
  wishlist?: Product[];
  createdAt: string;
}

export interface OrderUser {
  _id?: string;
  name?: string;
  email?: string;
}

export interface OrderItem {
  _id?: string;
  name: string;
  quantity: number;
  price: number;
  product?: string;
  mysteryBox?: string;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderStatusHistory {
  status: string;
  note?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  user?: OrderUser;
  orderItems: OrderItem[];
  shippingAddress: OrderAddress;
  paymentMethod: string;
  orderStatus: string;
  totalPrice: number;
  isPaid?: boolean;
  paidAt?: string;
  itemsPrice?: number;
  shippingPrice?: number;
  discountAmount?: number;
  couponCode?: string;
  walletAmountUsed?: number;
  trackingNumber?: string;
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  expiryDate: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface MysteryBoxProductPool {
  product: string | { _id: string };
  weight?: number;
}

export interface MysteryBox {
  _id: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium';
  price: number;
  description: string;
  minProducts: number;
  maxProducts: number;
  minValue: number;
  stock: number;
  soldCount?: number;
  isActive: boolean;
  productPool: MysteryBoxProductPool[];
  possibleItems?: { name?: string; image?: string; description?: string }[];
  image?: string;
}

export interface Payment {
  _id: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  user?: OrderUser;
  amount: number;
  method?: string;
  status: string;
  createdAt: string;
}

export interface Reel {
  _id: string;
  title: string;
  creator: string;
  image: string;
  ctaLink?: string;
  section?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Brand {
  _id: string;
  name: string;
  image: string;
  origin?: string;
}

export interface MarketingLink {
  _id: string;
  channel: 'instagram' | 'whatsapp' | 'google_ads' | 'web' | 'other';
  label: string;
  url: string;
  notes?: string;
  isActive: boolean;
  sortOrder?: number;
  acquisitionUrl?: string;
}

export interface CartItemProduct {
  _id: string;
  name: string;
  images: ProductImage[];
}

export interface CartItemMysteryBox {
  _id: string;
  name: string;
  image?: string;
}

export interface CartItem {
  _id: string;
  product?: CartItemProduct;
  mysteryBox?: CartItemMysteryBox;
  itemType: 'product' | 'mysteryBox';
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  total?: number;
  totalItems?: number;
}

export interface MonthlyRevenue {
  _id: { month: number; year: number };
  revenue: number;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  recentOrders: Order[];
  monthlyRevenue: MonthlyRevenue[];
  stockInvestment: number;
  totalExpenses: number;
  totalInvestment: number;
  totalCogs: number;
  totalProfit: number;
  profitMargin: number;
}

export interface Expense {
  _id: string;
  name: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: { name?: string; avatar?: string };
  views?: number;
  relatedProducts?: Product[];
  createdAt: string;
}

export interface Bundle {
  _id: string;
  name: string;
  description?: string;
  price: number;
  bundlePrice?: number;
  originalPrice?: number;
  image?: string;
  images?: { url: string; publicId?: string }[];
  products?: Product[];
  isActive?: boolean;
}

export interface GiftCard {
  _id: string;
  code: string;
  amount: number;
  balance?: number;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  status: string;
  expiresAt?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface AffiliatePayout {
  _id: string;
  amount: number;
  status: string;
  method?: string;
  createdAt: string;
}

export interface AffiliateReferral {
  _id?: string;
  order?: string | { orderNumber?: string; _id?: string };
  date?: string;
  orderAmount?: number;
  commission?: number;
  status?: string;
}

export interface Affiliate {
  _id: string;
  code: string;
  status: string;
  bio?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  payoutMethod?: string;
  payoutDetails?: string;
  totalEarnings?: number;
  pendingPayout?: number;
  clickCount?: number;
  conversionCount?: number;
  totalClicks?: number;
  totalOrders?: number;
  payouts?: AffiliatePayout[];
  referrals?: AffiliateReferral[];
}

export interface SalaryRecord {
  _id: string;
  month: number;
  year: number;
  amount: number;
  paymentMode?: string;
  totalDays?: number;
  presentDays?: number;
  paidAt: string;
  note?: string;
}

export interface SalaryComponent {
  name: string;
  amount: number;
}

export interface Employee {
  _id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  joiningDate?: string;
  monthlySalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  status: 'active' | 'inactive';
  salaryRecords: SalaryRecord[];
  createdAt: string;
}

export interface Refund {
  _id: string;
  order?: { _id: string; orderNumber?: string; totalPrice: number; orderStatus: string };
  user?: { _id: string; name?: string; email?: string };
  orderNumber?: string;
  amount: number;
  reason: string;
  method: 'wallet' | 'bank' | 'razorpay' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
}
