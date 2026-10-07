import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: { sql: string; status: string }[] = [];

  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS address text`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'ONHAND'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS eta_start timestamp`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS eta_end timestamp`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved integer NOT NULL DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS item_type text`,
    `UPDATE products SET item_type = 'Bags' WHERE item_type IS NULL`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_proof text`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_confirmed boolean NOT NULL DEFAULT false`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id text`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_name text`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address text`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamp`,
    `CREATE TABLE IF NOT EXISTS payment_methods (id text PRIMARY KEY, type text NOT NULL, name text NOT NULL, account_name text, account_number text, qr_code text, is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS categories (id text PRIMARY KEY, name text NOT NULL UNIQUE, description text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS expenses (id text PRIMARY KEY, title text NOT NULL, category text NOT NULL, amount double precision NOT NULL, date timestamp NOT NULL, notes text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS store_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamp NOT NULL DEFAULT now())`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS model text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS color text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS dimension text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS size text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS hardware text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS stamp text`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS authenticated boolean NOT NULL DEFAULT false`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price double precision`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS inclusions text`,
    `CREATE TABLE IF NOT EXISTS item_types (id text PRIMARY KEY, name text NOT NULL UNIQUE, created_at timestamp NOT NULL DEFAULT now())`,
    // Seed with only the item types that actually have products — admins
    // add more via Admin > Item Types as needed, instead of a long fixed list.
    `INSERT INTO item_types (id, name) SELECT DISTINCT ON (item_type) 'it_' || md5(item_type), item_type FROM products WHERE item_type IS NOT NULL AND item_type != '' ON CONFLICT (name) DO NOTHING`,
    `CREATE TABLE IF NOT EXISTS product_images (id text PRIMARY KEY, product_id text NOT NULL REFERENCES products(id), url text NOT NULL, sort_order integer NOT NULL DEFAULT 0, created_at timestamp NOT NULL DEFAULT now())`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text`,
    `CREATE SEQUENCE IF NOT EXISTS product_sku_seq`,
    // Backfill existing rows that don't have one yet, oldest first, so SKUs
    // stay stable for anything already assigned.
    `UPDATE products SET sku = 'HG-' || lpad(nextval('product_sku_seq')::text, 6, '0') WHERE sku IS NULL`,
    `DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku); EXCEPTION WHEN duplicate_table THEN null; WHEN others THEN null; END $$`,
    // unique constraint on customer_id (skip if already exists)
    `DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_customer_id_unique UNIQUE (customer_id); EXCEPTION WHEN duplicate_table THEN null; WHEN others THEN null; END $$`,
    // Per-step accountability trail for orders (who confirmed, shipped, etc.)
    `CREATE TABLE IF NOT EXISTS order_status_history (id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id), status text NOT NULL, note text, actor_id text REFERENCES users(id), actor_name text NOT NULL, actor_role text NOT NULL, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON order_status_history(order_id)`,
    // Showroom viewing appointments, booked by the hour
    `CREATE TABLE IF NOT EXISTS appointments (id text PRIMARY KEY, user_id text REFERENCES users(id), name text NOT NULL, email text NOT NULL, phone text, date text NOT NULL, hour integer NOT NULL, notes text, status text NOT NULL DEFAULT 'PENDING', created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(date)`,
  ];

  for (const migration of migrations) {
    try {
      await db.execute(sql.raw(migration));
      results.push({ sql: migration.slice(0, 60), status: 'ok' });
    } catch (e: any) {
      results.push({ sql: migration.slice(0, 60), status: e.message.slice(0, 100) });
    }
  }

  return NextResponse.json({ done: true, results });
}
