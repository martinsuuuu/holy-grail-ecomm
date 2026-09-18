// Fixed item-type taxonomy, distinct from `category` (which stores the
// brand/maison, e.g. "Chanel"). Used by the admin product form, product
// filtering, and the "Shop by Categories" nav dropdown.
export const ITEM_TYPES = ['Jewelries', 'Watches', 'Apparels', 'Bags'] as const;

export type ItemType = (typeof ITEM_TYPES)[number];
