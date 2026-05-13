/**
 * Pass full order JSON from My orders → invoice tab (window.open).
 * localStorage is per-origin and shared with the new tab; sessionStorage is not.
 */
const STORAGE_KEY = 'kosmeticx_invoice_transfer_v1';

export function persistOrderForInvoicePage(orderId: string, order: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ orderId, order, savedAt: Date.now() }),
  );
}

/** Returns the order object and clears the slot when orderId matches. */
export function consumeOrderForInvoicePage(orderId: string): unknown | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { orderId?: string; order?: unknown };
    if (parsed.orderId !== orderId) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    localStorage.removeItem(STORAGE_KEY);
    return parsed.order ?? null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
