export const GA_MEASUREMENT_ID = 'G-G8Q7117KR9';

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function pageview(url: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

export function event(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, params);
}

export function trackAddToCart(params: {
  itemId: string;
  itemName: string;
  price: number;
  quantity?: number;
  brand?: string;
}) {
  event('add_to_cart', {
    currency: 'INR',
    value: params.price * (params.quantity ?? 1),
    items: [{
      item_id: params.itemId,
      item_name: params.itemName,
      item_brand: params.brand,
      price: params.price,
      quantity: params.quantity ?? 1,
    }],
  });
}

export function trackRemoveFromCart(params: {
  itemId: string;
  itemName: string;
  price: number;
  quantity?: number;
}) {
  event('remove_from_cart', {
    currency: 'INR',
    value: params.price * (params.quantity ?? 1),
    items: [{
      item_id: params.itemId,
      item_name: params.itemName,
      price: params.price,
      quantity: params.quantity ?? 1,
    }],
  });
}

export function trackBeginCheckout(params: { value: number; items: { item_id: string; item_name: string; price: number; quantity: number }[] }) {
  event('begin_checkout', {
    currency: 'INR',
    value: params.value,
    items: params.items,
  });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  shipping?: number;
  discount?: number;
  items: { item_id: string; item_name: string; price: number; quantity: number }[];
}) {
  event('purchase', {
    currency: 'INR',
    transaction_id: params.transactionId,
    value: params.value,
    shipping: params.shipping ?? 0,
    discount: params.discount ?? 0,
    items: params.items,
  });
}
