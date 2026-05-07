'use client';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchCart } from '@/store/slices/cartSlice';
import api from '@/lib/api';
import { formatPrice, loadRazorpayScript } from '@/lib/utils';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'fullName',     label: 'Full Name',               col: 'col-span-2', placeholder: 'John Doe' },
  { key: 'phone',        label: 'Phone Number',             col: '',           placeholder: '9876543210' },
  { key: 'pincode',      label: 'Pincode',                  col: '',           placeholder: '400001' },
  { key: 'addressLine1', label: 'Address Line 1',           col: 'col-span-2', placeholder: 'House / Flat no., Street' },
  { key: 'addressLine2', label: 'Address Line 2 (optional)',col: 'col-span-2', placeholder: 'Landmark, Area' },
  { key: 'city',         label: 'City',                     col: '',           placeholder: 'Mumbai' },
  { key: 'state',        label: 'State',                    col: '',           placeholder: 'Maharashtra' },
];

export default function CheckoutPage() {
  const router   = useRouter();
  const dispatch = useDispatch<any>();
  const { user }           = useSelector((state: any) => state.auth);
  const { items, summary } = useSelector((state: any) => state.cart);

  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod,   setPaymentMethod]   = useState<'razorpay' | 'cod' | 'bnpl'>('razorpay');
  const [useWallet,       setUseWallet]       = useState(false);
  const [placing,         setPlacing]         = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [newAddress,      setNewAddress]      = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '',
  });

  // Gift Card state
  const [showGiftCard,    setShowGiftCard]    = useState(false);
  const [giftCardCode,    setGiftCardCode]    = useState('');
  const [gcLoading,       setGcLoading]       = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    dispatch(fetchCart());
    if (user.addresses?.length > 0) {
      setSelectedAddress(user.addresses.find((a: any) => a.isDefault) || user.addresses[0]);
    } else {
      setShowForm(true);
    }
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/addresses', newAddress);
      const saved = data.addresses[data.addresses.length - 1];
      setSelectedAddress(saved);
      setShowForm(false);
      toast.success('Address saved');
    } catch { toast.error('Failed to save address'); }
  };

  // Gift card apply handler
  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) { toast.error('Enter a gift card code'); return; }
    setGcLoading(true);
    try {
      const { data } = await api.post('/gift-cards/validate', { code: giftCardCode.trim() });
      setAppliedGiftCard({ code: giftCardCode.trim(), balance: data.balance });
      toast.success('Gift card applied!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired gift card');
    } finally {
      setGcLoading(false);
    }
  };

  const walletDeduct   = useWallet ? Math.min(user?.wallet || 0, summary.total) : 0;
  const giftCardDeduct = appliedGiftCard
    ? Math.min(appliedGiftCard.balance, Math.max(0, summary.total - walletDeduct))
    : 0;
  const effectiveTotal = Math.max(0, summary.total - walletDeduct - giftCardDeduct);

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const { data: orderRes } = await api.post('/orders', {
        shippingAddress: {
          fullName:     selectedAddress.fullName,
          phone:        selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 || '',
          city:         selectedAddress.city,
          state:        selectedAddress.state,
          pincode:      selectedAddress.pincode,
        },
        paymentMethod,
        walletAmountUsed: walletDeduct,
        ...(appliedGiftCard ? { giftCardCode: appliedGiftCard.code } : {}),
      });

      const order = orderRes.order;

      // COD and BNPL both complete without payment gateway
      if (paymentMethod === 'cod' || paymentMethod === 'bnpl') {
        toast.success(paymentMethod === 'bnpl' ? 'Order placed! BNPL payment pending. 🎉' : 'Order placed successfully! 🎉');
        router.push('/profile/orders');
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway'); setPlacing(false); return; }

      const { data: rpData } = await api.post('/payments/create-order', { orderId: order._id });

      const itemsSummary = items
        .map((i: any) => `${i.product?.name || i.mysteryBox?.name || 'Item'} x${i.quantity}`)
        .join(', ');

      const rzp = new (window as any).Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rpData.amount,
        currency:    rpData.currency || 'INR',

        // Brand identity shown in the Razorpay modal
        name:        'GlowBox Cosmetics',
        image:       `${process.env.NEXT_PUBLIC_SITE_URL || ''}/logo.png`,
        description: `Order #${order._id.slice(-8).toUpperCase()} · ${items.length} item${items.length > 1 ? 's' : ''}`,

        order_id: rpData.razorpayOrderId,

        // Full customer details — helps Razorpay dashboard & support lookups
        prefill: {
          name:    user.name  || '',
          email:   user.email || '',
          contact: user.phone || selectedAddress?.phone || '',
        },

        // Shipping address passed as notes — visible in Razorpay dashboard for every payment
        notes: {
          order_id:       order._id,
          order_ref:      `#${order._id.slice(-8).toUpperCase()}`,
          customer_name:  user.name,
          customer_email: user.email,
          customer_phone: user.phone || selectedAddress?.phone || '',
          items:          itemsSummary,
          item_count:     String(items.length),
          subtotal:       `₹${summary.subtotal}`,
          shipping:       summary.shipping === 0 ? 'Free' : `₹${summary.shipping}`,
          discount:       summary.discount > 0 ? `₹${summary.discount}` : 'None',
          wallet_used:    walletDeduct > 0 ? `₹${walletDeduct}` : 'None',
          gift_card:      appliedGiftCard ? appliedGiftCard.code : 'None',
          total_paid:     `₹${effectiveTotal}`,
          // Shipping address for delivery verification
          ship_name:      selectedAddress?.fullName    || '',
          ship_address:   selectedAddress?.addressLine1 || '',
          ship_city:      selectedAddress?.city        || '',
          ship_state:     selectedAddress?.state       || '',
          ship_pincode:   selectedAddress?.pincode     || '',
          ship_phone:     selectedAddress?.phone       || '',
        },

        // Lock prefill fields so customer cannot accidentally change them
        readonly: {
          email:   true,
          contact: !!user.phone,
        },

        // Payment config
        theme:   { color: '#e11d48', hide_topbar: false },
        retry:   { enabled: true, max_count: 3 },
        timeout: 900, // 15 min before the modal auto-closes

        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId:             order._id,
            });
            toast.success('Payment successful! Order confirmed 🎉');
            dispatch(fetchCart());
            router.push('/profile/orders');
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss:           () => { setPlacing(false); toast.error('Payment cancelled'); },
          confirm_close:       true,
          escape:              false,
          animation:           true,
          backdropclose:       false,
          handleback:          true,
        },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setPlacing(false);
    }
  };

  if (!user || items.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to your cart before checking out</p>
        <Link href="/products" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
          Shop Products →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cart" className="w-9 h-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors text-sm">←</Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-400 text-sm">{items.length} item{items.length !== 1 ? 's' : ''} · {formatPrice(summary.subtotal)}</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            {['Cart', 'Checkout', 'Confirmed'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 font-semibold ${i === 1 ? 'text-pink-600' : i < 1 ? 'text-gray-400' : 'text-gray-300'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === 1 ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white' : i < 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-300'}`}>{i + 1}</span>
                  {s}
                </div>
                {i < 2 && <span className="text-gray-200">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* ① Delivery Address */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
                <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                <h2 className="font-bold text-gray-900 text-lg">Delivery Address</h2>
              </div>

              <div className="p-6">
                {user.addresses?.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {user.addresses.map((addr: any) => {
                      const selected = selectedAddress?._id === addr._id;
                      return (
                        <label
                          key={addr._id}
                          className={`flex gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                            selected
                              ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm'
                              : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/30'
                          }`}
                        >
                          {/* Custom radio */}
                          <div className="mt-0.5 flex-shrink-0">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'border-pink-500' : 'border-gray-300'}`}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />}
                            </div>
                          </div>
                          <input type="radio" name="address" className="sr-only" checked={selected} onChange={() => setSelectedAddress(addr)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 text-sm">{addr.fullName}</p>
                              {addr.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Default</span>}
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">📞 {addr.phone}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-semibold border border-pink-200 hover:border-pink-400 px-4 py-2 rounded-full transition-all"
                  >
                    <span className="text-lg leading-none">+</span> Add New Address
                  </button>
                ) : (
                  <form onSubmit={handleAddAddress} className="border-t border-gray-100 pt-5">
                    <p className="text-sm font-bold text-gray-700 mb-4">New Address</p>
                    <div className="grid grid-cols-2 gap-4">
                      {FIELDS.map(({ key, label, col, placeholder }) => (
                        <div key={key} className={col}>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                          <input
                            type="text"
                            placeholder={placeholder}
                            value={(newAddress as any)[key]}
                            onChange={(e) => setNewAddress((p) => ({ ...p, [key]: e.target.value }))}
                            required={key !== 'addressLine2'}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all placeholder:text-gray-300"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                      <button type="submit" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:shadow-md hover:scale-105 transition-all">
                        Save Address
                      </button>
                      <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ② Payment Method */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
                <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">2</span>
                <h2 className="font-bold text-gray-900 text-lg">Payment Method</h2>
              </div>

              <div className="p-6 space-y-3">
                {/* Razorpay */}
                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'razorpay' ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm' : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/30'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${paymentMethod === 'razorpay' ? 'border-pink-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />}
                  </div>
                  <input type="radio" name="payment" className="sr-only" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm">Online Payment</span>
                      <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-md">Razorpay</span>
                    </div>
                    <p className="text-xs text-gray-400">Cards · UPI · Net Banking · Wallets · EMI</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300 text-xl">
                    <span title="Card">💳</span>
                    <span title="UPI">📱</span>
                    <span title="Net Banking">🏦</span>
                  </div>
                </label>

                {/* COD */}
                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'cod' ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 shadow-sm' : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/30'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${paymentMethod === 'cod' ? 'border-pink-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500" />}
                  </div>
                  <input type="radio" name="payment" className="sr-only" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm">Cash on Delivery</span>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-md">COD</span>
                    </div>
                    <p className="text-xs text-gray-400">Pay in cash when your order arrives</p>
                  </div>
                  <span className="text-2xl text-gray-300">💵</span>
                </label>

                {/* ── BNPL ── */}
                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === 'bnpl' ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm' : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${paymentMethod === 'bnpl' ? 'border-indigo-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'bnpl' && <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />}
                  </div>
                  <input type="radio" name="payment" className="sr-only" value="bnpl" checked={paymentMethod === 'bnpl'} onChange={() => setPaymentMethod('bnpl')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm">Buy Now Pay Later</span>
                      <span className="text-xs bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-md">BNPL</span>
                    </div>
                    <p className="text-xs text-gray-400">Pay in 3 easy instalments — powered by Simpl</p>
                  </div>
                  <span className="text-2xl text-gray-300">📅</span>
                </label>

                {/* Wallet */}
                {user?.wallet > 0 && (
                  <div
                    onClick={() => setUseWallet((v) => !v)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${useWallet ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm' : 'border-gray-100 hover:border-amber-200'}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${useWallet ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                      {useWallet && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">Use Wallet Balance</span>
                        {useWallet && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-md">Applied</span>}
                      </div>
                      <p className="text-xs text-amber-600 font-semibold">Available: {formatPrice(user.wallet)}</p>
                    </div>
                    <span className="text-2xl">👜</span>
                  </div>
                )}

                {/* ── Gift Card ── */}
                <div
                  onClick={() => !appliedGiftCard && setShowGiftCard((v) => !v)}
                  className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                    appliedGiftCard
                      ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm cursor-default'
                      : showGiftCard
                      ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm cursor-pointer'
                      : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 cursor-pointer'
                  }`}
                >
                  {/* Toggle row */}
                  <div className="flex items-center gap-4 p-5">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${(showGiftCard || appliedGiftCard) ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                      {(showGiftCard || appliedGiftCard) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">🎁 Use Gift Card</span>
                        {appliedGiftCard && <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-md">Applied</span>}
                      </div>
                      {appliedGiftCard ? (
                        <p className="text-xs text-teal-600 font-semibold">
                          Gift Card Applied — {formatPrice(appliedGiftCard.balance)} available
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Redeem a gift card at checkout</p>
                      )}
                    </div>
                    <span className="text-2xl">🎁</span>
                  </div>

                  {/* Input row — shown when toggled and no card applied yet */}
                  {showGiftCard && !appliedGiftCard && (
                    <div
                      className="px-5 pb-5 pt-0"
                      onClick={(e) => e.stopPropagation()} // prevent collapse when clicking inside
                    >
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          placeholder="GIFT-XXXX-XXXX"
                          className="flex-1 bg-white border border-teal-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent placeholder:text-gray-300 uppercase"
                        />
                        <button
                          onClick={handleApplyGiftCard}
                          disabled={gcLoading}
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {gcLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* ── /Gift Card ── */}

              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 sticky top-24 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 text-lg">Order Summary</h2>
              </div>

              {/* Items list */}
              <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
                {items.map((item: any) => {
                  const name  = item.product?.name || item.mysteryBox?.name || item.name;
                  const image = item.product?.images?.[0]?.url || item.image;
                  return (
                    <div key={item._id} className="flex items-center gap-3 group">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 flex-shrink-0 shadow-sm">
                        {image
                          ? <Image src={image} alt={name} fill className="object-cover group-hover:scale-105 transition-transform" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">{item.itemType === 'mysteryBox' ? '🎁' : '💄'}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                        <p className="text-xs text-gray-400">×{item.quantity} · {formatPrice(item.price)} each</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-700 font-medium">{formatPrice(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? 'text-green-600 font-semibold' : 'text-gray-700 font-medium'}>
                    {summary.shipping === 0 ? 'FREE' : formatPrice(summary.shipping)}
                  </span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>− {formatPrice(summary.discount)}</span>
                  </div>
                )}
                {useWallet && walletDeduct > 0 && (
                  <div className="flex justify-between text-sm text-amber-600 font-medium">
                    <span>Wallet Credit</span>
                    <span>− {formatPrice(walletDeduct)}</span>
                  </div>
                )}
                {appliedGiftCard && giftCardDeduct > 0 && (
                  <div className="flex justify-between text-sm text-teal-600 font-medium">
                    <span>Gift Card</span>
                    <span>− {formatPrice(giftCardDeduct)}</span>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span className="text-pink-600">{formatPrice(effectiveTotal)}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={placeOrder}
                  disabled={placing || !selectedAddress}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base"
                >
                  {placing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing…
                    </>
                  ) : paymentMethod === 'cod' ? (
                    <>Place Order (COD) →</>
                  ) : paymentMethod === 'bnpl' ? (
                    <>Place Order (BNPL) →</>
                  ) : (
                    <>
                      <span>🔒</span>
                      Pay {formatPrice(effectiveTotal)}
                    </>
                  )}
                </button>

                {/* Security row */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  {[
                    { icon: '🔒', label: 'SSL Secured' },
                    { icon: '💳', label: 'Razorpay' },
                    { icon: '↩️', label: '7-Day Return' },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-1 text-gray-400">
                      <span className="text-sm">{b.icon}</span>
                      <span className="text-[10px] font-medium">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
