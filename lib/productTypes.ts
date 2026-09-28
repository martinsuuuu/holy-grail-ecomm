// Fixed item-type taxonomy, distinct from `category` (which stores the
// brand/maison, e.g. "Chanel"). Used by the admin product form, product
// filtering, and the "Shop by Categories" nav dropdown.
// Sourced from the store's official master inventory categories.
export const ITEM_TYPES = [
  'Bags',
  'Eyewear',
  'Watches',
  'Jewelries',
  'Apparels',
  'Wallets',
  'Accessories',
  'Luggage',
  'Shoes',
  'Belts',
  'Scarves',
  'Caps',
  'Card Holders',
  'Fragrances',
  'Neckties',
  'Pillows',
  'Straps',
  'Turbans & Headbands',
] as const;

// The handful of types that realistically get their own imagery/nav tile —
// the rest show as plain text links until they have stocked products.
export const FEATURED_ITEM_TYPES = ['Bags', 'Eyewear', 'Watches', 'Jewelries', 'Apparels', 'Wallets', 'Accessories', 'Luggage'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];
