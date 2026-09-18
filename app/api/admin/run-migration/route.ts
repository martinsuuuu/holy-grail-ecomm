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
    // unique constraint on customer_id (skip if already exists)
    `DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_customer_id_unique UNIQUE (customer_id); EXCEPTION WHEN duplicate_table THEN null; WHEN others THEN null; END $$`,
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
