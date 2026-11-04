// The delivery options offered at checkout. Orders placed before these were
// introduced still carry the older values, so those keep a label for display.
export const DELIVERY_METHODS = [
  { value: 'DHL', label: 'DHL', desc: 'International shipping' },
  { value: 'GRAB', label: 'Grab Pickup', desc: 'Same-day within serviceable areas' },
  { value: 'LBC', label: 'LBC', desc: 'Nationwide delivery' },
] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]['value'];

export const DELIVERY_VALUES: string[] = DELIVERY_METHODS.map((m) => m.value);

const DELIVERY_LABELS: Record<string, string> = {
  DHL: 'DHL',
  GRAB: 'Grab Pickup',
  LBC: 'LBC',
  WALK_IN: 'Walk-in / In-Store',
  // Legacy options — no longer selectable, but old orders still show them
  LALAMOVE: 'Lalamove',
  SHOPEE: 'Shopee',
  JNT: 'J&T Express',
};

export function deliveryLabel(value: string): string {
  return DELIVERY_LABELS[value] ?? value;
}
