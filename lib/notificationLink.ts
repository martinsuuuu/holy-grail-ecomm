// Order notifications mention their order as "#AB12CD34" (last 8 chars of the order id).
const ORDER_REF = /#([A-Za-z0-9]{8})\b/;

export function orderRefFromNotification(n: { type: string; message: string }): string | null {
  if (n.type !== 'ORDER') return null;
  return n.message.match(ORDER_REF)?.[1] ?? null;
}

// Where an order notification should take this user, or null if it can't link anywhere.
// Customers land on the status section of their order; staff open it in the admin orders list.
export async function resolveOrderHref(
  n: { type: string; message: string },
  role: string | undefined
): Promise<string | null> {
  const ref = orderRefFromNotification(n);
  if (!ref || (role !== 'ADMIN' && role !== 'CUSTOMER')) return null;
  try {
    const res = await fetch(`/api/orders/lookup?ref=${ref}`);
    if (!res.ok) return null;
    const { id } = await res.json();
    return role === 'ADMIN' ? `/admin/orders?order=${id}` : `/account/orders/${id}#order-status`;
  } catch {
    return null;
  }
}
