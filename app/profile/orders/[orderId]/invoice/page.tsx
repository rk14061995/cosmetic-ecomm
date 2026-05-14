'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useRequireUser } from '@/hooks/useRequireUser';
import { formatPrice, formatDate } from '@/lib/utils';
import { getSiteName } from '@/lib/seo';
import { consumeOrderForInvoicePage } from '@/lib/orderInvoiceTransfer';
import { formatOrderLabelForDisplay } from '@/lib/orderDisplay';

type ShippingAddr = {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type OrderItem = {
  _id?: string;
  name?: string;
  price?: number;
  quantity?: number;
};

/** Row shape from GET /orders/my-orders (stored via localStorage for this page). */
export type InvoiceOrderRow = {
  _id: string;
  orderNumber?: string;
  createdAt?: string;
  paidAt?: string;
  orderStatus?: string;
  paymentMethod?: string;
  orderItems?: OrderItem[];
  shippingAddress?: ShippingAddr;
  itemsPrice?: number;
  shippingPrice?: number;
  discountAmount?: number;
  walletAmountUsed?: number;
  totalPrice?: number;
  couponCode?: string;
  invoiceNumber?: string;
};

function buildInvoiceNumber(order: InvoiceOrderRow): string {
  if (order.invoiceNumber) return order.invoiceNumber;
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const year = created.getFullYear();
  if (order.orderNumber) {
    const tail = String(order.orderNumber).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-12);
    return `INV-${year}-${tail}`;
  }
  const suffix = String(order._id).replace(/[^a-fA-F0-9]/g, '').slice(-6).toUpperCase();
  return `INV-${year}-${suffix}`;
}

function orderMatchesRouteParam(order: InvoiceOrderRow, routeId: string): boolean {
  const decoded = decodeURIComponent(routeId);
  if (order.orderNumber && order.orderNumber === decoded) return true;
  return String(order._id) === decoded;
}

type InvoiceView = {
  order: InvoiceOrderRow;
  customer: { name?: string; email?: string; phone?: string };
  invoiceNumber: string;
  siteName: string;
};

const INVOICE_BRAND_LOGO = '/1000104062.jpg';

function InvoiceSheet({ view }: { view: InvoiceView }) {
  const { order, customer, invoiceNumber, siteName } = view;
  const addr = order.shippingAddress || {};
  const items = order.orderItems || [];

  return (
    <div className="invoice-print-root max-w-3xl mx-auto px-4 py-8 print:py-4 print:max-w-none">
      <article className="invoice-sheet bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none">
        <div className="px-8 py-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <img
              src={INVOICE_BRAND_LOGO}
              alt={siteName}
              width={160}
              height={160}
              className="h-16 w-auto max-w-[140px] object-contain object-left shrink-0 sm:h-20 sm:max-w-[180px] print:h-14 print:max-w-[120px]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">Tax invoice</p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{siteName}</h1>
              <p className="text-sm text-slate-500 mt-2 font-mono">{invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 grid sm:grid-cols-2 gap-8 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Bill to</h2>
            <p className="font-semibold text-slate-900">{customer.name || addr.fullName || 'Customer'}</p>
            {customer.email && <p className="text-sm text-slate-600 mt-1">{customer.email}</p>}
            <p className="text-sm text-slate-600 mt-1">{customer.phone || addr.phone || '—'}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Ship to</h2>
            <p className="font-semibold text-slate-900">{addr.fullName || '—'}</p>
            <p className="text-sm text-slate-600 mt-1">{addr.addressLine1 || '—'}</p>
            {addr.addressLine2 && <p className="text-sm text-slate-600">{addr.addressLine2}</p>}
            <p className="text-sm text-slate-600 mt-1">
              {[addr.city, addr.state].filter(Boolean).join(', ')}
              {addr.pincode ? ` — ${addr.pincode}` : ''}
            </p>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Order ID</p>
            <p className="font-mono text-slate-800 mt-0.5 break-all">{formatOrderLabelForDisplay(order)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Order date</p>
            <p className="text-slate-800 mt-0.5">
              {order.createdAt ? formatDate(order.createdAt) : '—'}
            </p>
          </div>
          {order.paidAt && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Paid</p>
              <p className="text-slate-800 mt-0.5">{formatDate(order.paidAt)}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment</p>
            <p className="text-slate-800 mt-0.5 uppercase">{order.paymentMethod || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</p>
            <p className="text-slate-800 mt-0.5">{order.orderStatus || '—'}</p>
          </div>
        </div>

        <div className="px-8 py-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4">Item</th>
                <th className="pb-3 text-right w-16">Qty</th>
                <th className="pb-3 text-right w-28">Price</th>
                <th className="pb-3 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const name = item.name || 'Item';
                const qty = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                return (
                  <tr key={item._id || i} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-800">{name}</td>
                    <td className="py-3 text-right tabular-nums text-slate-600">{qty}</td>
                    <td className="py-3 text-right tabular-nums text-slate-600">{formatPrice(price)}</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatPrice(price * qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(Number(order.itemsPrice ?? 0))}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="tabular-nums">
                {Number(order.shippingPrice) === 0 ? 'FREE' : formatPrice(Number(order.shippingPrice ?? 0))}
              </span>
            </div>
            {Number(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="tabular-nums">− {formatPrice(Number(order.discountAmount))}</span>
              </div>
            )}
            {Number(order.walletAmountUsed || 0) > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Wallet</span>
                <span className="tabular-nums">− {formatPrice(Number(order.walletAmountUsed))}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="tabular-nums text-indigo-600">{formatPrice(Number(order.totalPrice ?? 0))}</span>
            </div>
          </div>
        </div>

        <p className="px-8 py-5 text-center text-xs text-slate-400 border-t border-slate-100">
          This is a system-generated tax invoice for your records.
        </p>
      </article>
    </div>
  );
}

export default function OrderInvoicePage() {
  const params = useParams();
  const orderId =
    typeof params.orderId === 'string' ? params.orderId : Array.isArray(params.orderId) ? params.orderId[0] : '';
  const loginPath = orderId
    ? `/auth/login?redirect=${encodeURIComponent(`/profile/orders/${orderId}/invoice`)}`
    : '/auth/login';
  const { user, authReady, isAuthed } = useRequireUser(loginPath);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<InvoiceView | null>(null);

  useEffect(() => {
    if (!authReady || !user || !orderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (authReady && !user) setLoading(false);
      return;
    }

    const raw = consumeOrderForInvoicePage(orderId);
    if (!raw || typeof raw !== 'object') {
      toast.error('Open the invoice from My orders so we can load your order details.');
      setView(null);
      setLoading(false);
      return;
    }

    const order = raw as InvoiceOrderRow;
    if (!order._id || !orderMatchesRouteParam(order, orderId)) {
      toast.error('Order data did not match. Open the invoice again from My orders.');
      setView(null);
      setLoading(false);
      return;
    }

    setView({
      order,
      customer: {
        name: user.name || order.shippingAddress?.fullName,
        email: user.email,
        phone: user.phone || order.shippingAddress?.phone,
      },
      invoiceNumber: buildInvoiceNumber(order),
      siteName: getSiteName(),
    });
    setLoading(false);
  }, [authReady, user, orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm font-medium">Loading invoice…</p>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600 text-center max-w-md">
          Invoice data was not found. Use the <strong>Invoice</strong> button on My orders — it passes your order into this page.
        </p>
        <Link href="/profile/orders" className="text-indigo-600 font-semibold hover:text-indigo-800">
          ← Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
            body * { visibility: hidden !important; }
            .invoice-print-root, .invoice-print-root * { visibility: visible !important; }
            .invoice-print-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0.5rem 1rem 1rem !important;
              background: #fff !important;
            }
            .invoice-toolbar { display: none !important; }
            .invoice-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          }
        `,
      }}
      />

      <header className="invoice-toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm print:hidden">
        <Link href="/profile/orders" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
          ← Orders
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-full shadow-sm"
        >
          Print
        </button>
      </header>

      <InvoiceSheet view={view} />
    </div>
  );
}
