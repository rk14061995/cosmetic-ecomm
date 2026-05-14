'use client';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchCart } from '@/store/slices/cartSlice';
import api from '@/lib/api';
import { formatPrice, loadRazorpayScript } from '@/lib/utils';
import type { UserAddress, ApiError } from '@/types/api';
import { formatOrderLabelForDisplay } from '@/lib/orderDisplay';
import RAZORPAY_LOGO from '@/lib/razorpayLogo';
import toast from 'react-hot-toast';
import { useRequireUser } from '@/hooks/useRequireUser';
import { INDIAN_STATES_AND_UTS } from '@/data/indianStates';

/** Razorpay checkout: max 15 note key-value pairs; each value max 256 chars. */
function razorpayNotes(entries: Record<string, string | number | undefined | null>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (Object.keys(out).length >= 15) break;
    const s = v == null || v === '' ? '' : String(v);
    out[k] = s.slice(0, 256);
  }
  return out;
}

type AddressDraft = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

const initialAddress: AddressDraft = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

const FIELDS: {
  key: keyof AddressDraft;
  label: string;
  gridClass: string;
  placeholder: string;
  optional?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  fieldKind?: 'text' | 'select';
}[] = [
  { key: 'fullName', label: 'Full name', gridClass: 'sm:col-span-2', placeholder: 'e.g. Priya Sharma' },
  {
    key: 'phone',
    label: 'Phone',
    gridClass: '',
    placeholder: '10-digit mobile number',
    inputMode: 'numeric',
  },
  { key: 'addressLine1', label: 'Address line 1', gridClass: 'sm:col-span-2', placeholder: 'House / flat, building, street' },
  {
    key: 'addressLine2',
    label: 'Address line 2',
    gridClass: 'sm:col-span-2',
    placeholder: 'Landmark, area (optional)',
    optional: true,
  },
  { key: 'city', label: 'City', gridClass: '', placeholder: 'City' },
  {
    key: 'state',
    label: 'State / UT',
    gridClass: '',
    placeholder: '',
    fieldKind: 'select',
  },
  {
    key: 'pincode',
    label: 'PIN code',
    gridClass: 'sm:col-span-2',
    placeholder: '6 digits',
    inputMode: 'numeric',
  },
];

export default function CheckoutPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { user, authReady, isAuthed } = useRequireUser();
  const { items, summary, couponCode } = useAppSelector((state) => state.cart);

  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [placing,         setPlacing]         = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [newAddress, setNewAddress] = useState<AddressDraft>({ ...initialAddress });

  useEffect(() => {
    if (!authReady || !user) return;
    dispatch(fetchCart());
    if (user.addresses?.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAddress(user.addresses.find((a) => a.isDefault) || user.addresses[0]);
    } else {
      setShowForm(true);
    }
  }, [authReady, user, dispatch]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      fullName: newAddress.fullName.trim(),
      phone: newAddress.phone.trim(),
      addressLine1: newAddress.addressLine1.trim(),
      addressLine2: newAddress.addressLine2.trim(),
      city: newAddress.city.trim(),
      state: newAddress.state.trim(),
      pincode: newAddress.pincode.trim(),
    };

    if (!payload.fullName || !payload.phone || !payload.addressLine1 || !payload.city || !payload.state || !payload.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }
    if (!/^\d{10}$/.test(payload.phone)) {
      toast.error('Phone number must be 10 digits');
      return;
    }
    if (!/^\d{6}$/.test(payload.pincode)) {
      toast.error('Pincode must be 6 digits');
      return;
    }

    try {
      const { data } = await api.post('/auth/addresses', payload);
      const saved = data?.addresses?.[data.addresses.length - 1];
      setSelectedAddress(saved);
      setShowForm(false);
      setNewAddress({ ...initialAddress });
      toast.success('Address saved');
    } catch (err) {
      toast.error((err as ApiError)?.response?.data?.message || 'Failed to save address');
    }
  };

  const effectiveTotal = summary.total;

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const orderItems = items.map((item) => ({
        ...(item.product?._id ? { product: item.product._id } : {}),
        ...(item.mysteryBox?._id ? { mysteryBox: item.mysteryBox._id } : {}),
        quantity: item.quantity,
        itemType: item.itemType,
      }));

      const { data: orderRes } = await api.post('/orders', {
        orderItems,
        shippingAddress: {
          fullName:     selectedAddress.fullName,
          phone:        selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 || '',
          city:         selectedAddress.city,
          state:        selectedAddress.state,
          pincode:      selectedAddress.pincode,
        },
        paymentMethod: 'razorpay',
        walletAmountUsed: 0,
        ...(couponCode ? { couponCode } : {}),
      });

      const order = orderRes.order;
      const orderLabel = formatOrderLabelForDisplay(order);

      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway'); setPlacing(false); return; }

      const { data: rpData } = await api.post('/payments/create-order', { orderId: order._id });

      const rzp = new (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } }).Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rpData.amount,
        currency:    rpData.currency || 'INR',

        // Brand identity shown in the Razorpay modal
        name:        process.env.NEXT_PUBLIC_SITE_NAME || 'KosmeticX',
        image:       RAZORPAY_LOGO,
        description: `${orderLabel} · ${items.length} item${items.length > 1 ? 's' : ''}`,

        order_id: rpData.razorpayOrderId,

        // Full customer details — helps Razorpay dashboard & support lookups
        prefill: {
          name:    user?.name  || '',
          email:   user?.email || '',
          contact: user?.phone || selectedAddress?.phone || '',
        },

        // Shipping + order context for Razorpay dashboard (max 15 keys — item list is in `description` above)
        notes: razorpayNotes({
          order_id: order._id,
          order_number: order.orderNumber || '',
          customer_name: user?.name || '',
          customer_email: user?.email || '',
          customer_phone: user?.phone || selectedAddress?.phone || '',
          subtotal: `₹${summary.subtotal}`,
          shipping: summary.shipping === 0 ? 'Free' : `₹${summary.shipping}`,
          discount: summary.discount > 0 ? `₹${summary.discount}` : 'None',
          wallet_used: 'None',
          total_paid: `₹${effectiveTotal}`,
          ship_address: selectedAddress?.addressLine1 || '',
          ship_city: selectedAddress?.city || '',
          ship_state: selectedAddress?.state || '',
          ship_pincode: selectedAddress?.pincode || '',
          ship_phone: selectedAddress?.phone || '',
        }),

        // Lock prefill fields so customer cannot accidentally change them
        readonly: {
          email:   true,
          contact: !!(user?.phone),
        },

        // Payment config
        theme:   { color: '#4f46e5', hide_topbar: false },
        retry:   { enabled: true, max_count: 3 },
        timeout: 900, // 15 min before the modal auto-closes

        handler: async (response: Record<string, string>) => {
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
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to place order');
      setPlacing(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  if (items.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to your cart before checking out</p>
        <Link href="/products" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold px-8 py-3.5 rounded-full hover:shadow-lg hover:scale-105 transition-all">
          Shop Products →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/cart" className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors text-sm">←</Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-400 text-sm">{items.length} item{items.length !== 1 ? 's' : ''} · {formatPrice(summary.subtotal)}</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            {['Cart', 'Checkout', 'Confirmed'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 font-semibold ${i === 1 ? 'text-indigo-600' : i < 1 ? 'text-gray-400' : 'text-gray-300'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === 1 ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white' : i < 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-300'}`}>{i + 1}</span>
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
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                <h2 className="font-bold text-gray-900 text-lg">Delivery Address</h2>
              </div>

              <div className="p-6">
                {(user?.addresses?.length ?? 0) > 0 && (
                  <div className="space-y-3 mb-5">
                    {(user?.addresses ?? []).map((addr) => {
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
                  <form onSubmit={handleAddAddress} className="mt-6 border-t border-gray-100 pt-6">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-gray-900">New delivery address</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          We&apos;ll use this for shipping and order updates.
                        </p>
                      </div>
                      <p className="shrink-0 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600 ring-1 ring-gray-100">
                        <span className="font-medium text-gray-800">*</span> Required · Line 2 optional
                      </p>
                    </div>

                    <div className="space-y-8">
                      <fieldset className="space-y-4">
                        <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</legend>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {(['fullName', 'phone'] as const).map((key) => {
                            const field = FIELDS.find((f) => f.key === key);
                            if (!field) return null;
                            const { label, gridClass, placeholder, optional, inputMode } = field;
                            return (
                              <div key={key} className={gridClass || undefined}>
                                <label htmlFor={`addr-${key}`} className="mb-1.5 block text-sm font-medium text-gray-700">
                                  {label}
                                  {!optional && <span className="text-rose-500"> *</span>}
                                </label>
                                <input
                                  id={`addr-${key}`}
                                  type="text"
                                  name={key}
                                  autoComplete={key === 'fullName' ? 'name' : 'tel'}
                                  inputMode={inputMode}
                                  placeholder={placeholder}
                                  value={newAddress[key]}
                                  onChange={(e) => setNewAddress((p) => ({ ...p, [key]: e.target.value }))}
                                  required={!optional}
                                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </fieldset>

                      <fieldset className="space-y-4">
                        <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Address</legend>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {(['addressLine1', 'addressLine2', 'city', 'state', 'pincode'] as const).map((key) => {
                            const field = FIELDS.find((f) => f.key === key);
                            if (!field) return null;
                            const { label, gridClass, placeholder, optional, inputMode, fieldKind } = field;
                            return (
                              <div key={key} className={gridClass || undefined}>
                                <label htmlFor={`addr-${key}`} className="mb-1.5 block text-sm font-medium text-gray-700">
                                  {label}
                                  {!optional && <span className="text-rose-500"> *</span>}
                                </label>
                                {fieldKind === 'select' ? (
                                  <select
                                    id={`addr-${key}`}
                                    name={key}
                                    value={newAddress.state}
                                    onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                                    required
                                    autoComplete="address-level1"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                  >
                                    <option value="">Select state / UT</option>
                                    {INDIAN_STATES_AND_UTS.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    id={`addr-${key}`}
                                    type="text"
                                    name={key}
                                    autoComplete={
                                      key === 'addressLine1'
                                        ? 'address-line1'
                                        : key === 'addressLine2'
                                          ? 'address-line2'
                                          : key === 'pincode'
                                            ? 'postal-code'
                                            : 'address-level2'
                                    }
                                    inputMode={inputMode}
                                    placeholder={placeholder}
                                    value={newAddress[key]}
                                    onChange={(e) => setNewAddress((p) => ({ ...p, [key]: e.target.value }))}
                                    required={!optional}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </fieldset>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setNewAddress({ ...initialAddress });
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      >
                        Save address
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

              <div className="p-6">
                <div className="relative flex items-center gap-4 p-5 rounded-[1.4rem] border-2 border-indigo-300 bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/70 shadow-sm">
                  <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-indigo-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm">Online Payment</span>
                      <span className="text-xs bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-md">Razorpay</span>
                    </div>
                    <p className="text-xs text-gray-500">Cards · UPI · Net Banking · Wallets · EMI</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-300 text-xl">
                    <span title="Card">◉</span>
                    <span title="UPI">◎</span>
                    <span title="Net Banking">◈</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-4 text-center">All orders are paid securely through Razorpay.</p>
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
                {items.map((item) => {
                  const name  = item.product?.name || item.mysteryBox?.name || item.name;
                  const image = item.product?.images?.[0]?.url || item.image;
                  return (
                    <div key={item._id} className="flex items-center gap-3 group">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 flex-shrink-0 shadow-sm">
                        {image
                          ? <Image src={image} alt={name ?? ''} fill className="object-cover group-hover:scale-105 transition-transform" />
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
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base"
                >
                  {placing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing…
                    </>
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
