import { pgTable, text, boolean, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  customerId: text('customer_id').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('CUSTOMER'),
  banned: boolean('banned').notNull().default(false),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  notifications: many(notifications),
}));

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  price: doublePrecision('price').notNull(),
  stock: integer('stock').notNull().default(0),
  reserved: integer('reserved').notNull().default(0),
  category: text('category'),
  imageUrl: text('image_url'),
  type: text('type').notNull().default('ONHAND'), // 'ONHAND' | 'PASABUY'
  etaStart: timestamp('eta_start'),
  etaEnd: timestamp('eta_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  purchaseOrderItems: many(purchaseOrderItems),
}));

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('PENDING_DEPOSIT'),
  deliveryMethod: text('delivery_method').notNull(),
  depositProof: text('deposit_proof'),
  depositConfirmed: boolean('deposit_confirmed').notNull().default(false),
  reservationExpiry: timestamp('reservation_expiry').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  paymentMethodId: text('payment_method_id'),
  paymentMethodName: text('payment_method_name'),
  deliveryAddress: text('delivery_address'),
  shippedAt: timestamp('shipped_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  supplier: text('supplier').notNull(),
  status: text('status').notNull().default('PENDING'),
  totalCost: doublePrecision('total_cost').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  receivedAt: timestamp('received_at'),
});

export const purchaseOrdersRelations = relations(purchaseOrders, ({ many }) => ({
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  purchaseOrderId: text('purchase_order_id').notNull().references(() => purchaseOrders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitCost: doublePrecision('unit_cost').notNull(),
});

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
}));

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const storeSettings = pgTable('store_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(), // 'GCASH' | 'BANK_TRANSFER'
  name: text('name').notNull(),
  accountName: text('account_name'),
  accountNumber: text('account_number'),
  qrCode: text('qr_code'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  type: text('type').notNull().default('INFO'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
