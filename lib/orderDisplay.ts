/** Public vs internal order identifiers (Mongo _id stays primary in DB). */

export type OrderLike = { _id: string; orderNumber?: string };

/** Use in URLs and API path segments (`/orders/:ref/...`). Prefers `orderNumber`, else legacy `_id`. */
export function getPublicOrderRef(order: OrderLike | null | undefined): string {
  if (!order) return '';
  const num = order.orderNumber?.trim();
  if (num) return num;
  const id = order._id != null ? String(order._id) : '';
  return id;
}

/** Customer-facing label in lists and emails. */
export function formatOrderLabelForDisplay(order: OrderLike | null | undefined): string {
  if (!order) return '—';
  if (order.orderNumber?.trim()) return order.orderNumber;
  const id = order._id != null ? String(order._id) : '';
  if (!id) return '—';
  return `#${id.slice(-8).toUpperCase()}`;
}
