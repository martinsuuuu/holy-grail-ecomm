import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { users } from '../db/schema';

const url = process.env.DATABASE_URL!.replace('&channel_binding=require', '').replace('?channel_binding=require', '');
const client = postgres(url, { ssl: { rejectUnauthorized: false } });
const db = drizzle(client);

async function main() {
  const seedUsers = [
    { name: 'Admin User', email: 'admin@retail.com', password: 'admin123', role: 'ADMIN' },
    { name: 'Shipper User', email: 'shipper@retail.com', password: 'shipper123', role: 'SHIPPER' },
    { name: 'Customer User', email: 'customer@retail.com', password: 'customer123', role: 'CUSTOMER' },
  ];

  for (const u of seedUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await db.insert(users).values({ name: u.name, email: u.email, password: hashed, role: u.role })
      .onConflictDoUpdate({ target: users.email, set: { password: hashed, role: u.role } });
    console.log(`Upserted: ${u.email}`);
  }

  await client.end();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
