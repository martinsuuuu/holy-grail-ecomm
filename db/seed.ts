import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { users, products, expenses, notifications, categories } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const client = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : 'require',
});
const db = drizzle(client, { schema });

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@retail.com')).limit(1);
  let admin;
  if (existingAdmin[0]) {
    admin = existingAdmin[0];
  } else {
    const arr = await db.insert(users).values({
      name: 'Admin User',
      email: 'admin@retail.com',
      password: adminPassword,
      role: 'ADMIN',
    }).returning();
    admin = arr[0];
  }

  // Create shipper user
  const shipperPassword = await bcrypt.hash('shipper123', 10);
  const existingShipper = await db.select().from(users).where(eq(users.email, 'shipper@retail.com')).limit(1);
  let shipper;
  if (existingShipper[0]) {
    shipper = existingShipper[0];
  } else {
    const arr = await db.insert(users).values({
      name: 'Shipper User',
      email: 'shipper@retail.com',
      password: shipperPassword,
      role: 'SHIPPER',
    }).returning();
    shipper = arr[0];
  }

  // Create customer user
  const customerPassword = await bcrypt.hash('customer123', 10);
  const existingCustomer = await db.select().from(users).where(eq(users.email, 'customer@retail.com')).limit(1);
  let customer;
  if (existingCustomer[0]) {
    customer = existingCustomer[0];
  } else {
    const arr = await db.insert(users).values({
      name: 'Jane Customer',
      email: 'customer@retail.com',
      password: customerPassword,
      role: 'CUSTOMER',
    }).returning();
    customer = arr[0];
  }

  console.log('Users created:', { admin: admin.email, shipper: shipper.email, customer: customer.email });

  // Create brand categories
  const categoryList = [
    { name: 'Louis Vuitton', description: 'French leather goods and travel house, founded 1854.' },
    { name: 'Chanel', description: 'Timeless Parisian elegance and quilted leather icons.' },
    { name: 'Hermès', description: 'Artisanal French leather goods, home of the Birkin and Kelly.' },
    { name: 'Gucci', description: 'Italian luxury fashion house known for bold, eclectic design.' },
    { name: 'Dior', description: 'Christian Dior\'s house of couture-inspired accessories.' },
  ];

  for (const cat of categoryList) {
    const existing = await db.select().from(categories).where(eq(categories.name, cat.name)).limit(1);
    if (!existing[0]) {
      await db.insert(categories).values(cat);
    }
  }

  console.log(`${categoryList.length} brand categories ready`);

  // Create products — luxury handbags
  const now = new Date();
  const productsList = [
    {
      name: 'Louis Vuitton Neverfull MM',
      description: 'Monogram canvas tote with spacious interior and signature leather trim. An everyday icon.',
      price: 95000,
      stock: 6,
      category: 'Louis Vuitton',
      imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Louis Vuitton Speedy 25',
      description: 'Compact monogram canvas top-handle bag, a Louis Vuitton archive favorite since 1930.',
      price: 110000,
      stock: 4,
      category: 'Louis Vuitton',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Louis Vuitton Capucines BB',
      description: 'Structured calfskin bag with the iconic LV flower clasp, made in the Asnières workshop.',
      price: 245000,
      stock: 0,
      category: 'Louis Vuitton',
      imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80',
      type: 'PASABUY',
      etaStart: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      etaEnd: new Date(now.getFullYear(), now.getMonth() + 1, 20),
    },
    {
      name: 'Chanel Classic Flap Medium',
      description: 'Quilted lambskin with the interlocking CC turn-lock and signature chain strap.',
      price: 380000,
      stock: 3,
      category: 'Chanel',
      imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Chanel Boy Bag Medium',
      description: 'Structured calfskin bag with aged-gold hardware and a bold chain-and-leather strap.',
      price: 320000,
      stock: 2,
      category: 'Chanel',
      imageUrl: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Chanel 19 Bag',
      description: 'Diamond-quilted goatskin with mixed vintage-style hardware, a modern Chanel classic.',
      price: 355000,
      stock: 0,
      category: 'Chanel',
      imageUrl: 'https://images.unsplash.com/photo-1761646237988-79635fce1841?w=600&q=80',
      type: 'PASABUY',
      etaStart: new Date(now.getFullYear(), now.getMonth() + 1, 10),
      etaEnd: new Date(now.getFullYear(), now.getMonth() + 1, 28),
    },
    {
      name: 'Hermès Birkin 30',
      description: 'Togo leather with palladium hardware. The house\'s most coveted silhouette, made to order.',
      price: 950000,
      stock: 1,
      category: 'Hermès',
      imageUrl: 'https://images.unsplash.com/photo-1760624294582-5341f33f9fa4?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Hermès Kelly 28',
      description: 'Structured Epsom leather bag with the iconic turn-lock strap closure and top handle.',
      price: 890000,
      stock: 0,
      category: 'Hermès',
      imageUrl: 'https://images.unsplash.com/photo-1702325107940-88f9cd4468c2?w=600&q=80',
      type: 'PASABUY',
      etaStart: new Date(now.getFullYear(), now.getMonth() + 2, 1),
      etaEnd: new Date(now.getFullYear(), now.getMonth() + 2, 15),
    },
    {
      name: 'Gucci GG Marmont Small',
      description: 'Matelassé chevron leather with the antique-gold Double G hardware and chain strap.',
      price: 89000,
      stock: 8,
      category: 'Gucci',
      imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Gucci Dionysus Small',
      description: 'Supreme canvas shoulder bag with tiger-head closure and a signature web stripe.',
      price: 105000,
      stock: 5,
      category: 'Gucci',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Dior Lady Dior Medium',
      description: 'Cannage-stitched lambskin with charm pendants spelling "D.I.O.R." A red-carpet mainstay.',
      price: 275000,
      stock: 4,
      category: 'Dior',
      imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80',
      type: 'ONHAND',
    },
    {
      name: 'Dior Saddle Bag',
      description: 'Oblique jacquard saddle-shaped bag with the signature D-shaped flap, revived from 1999.',
      price: 180000,
      stock: 7,
      category: 'Dior',
      imageUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80',
      type: 'ONHAND',
    },
  ];

  for (const product of productsList) {
    await db.insert(products).values(product);
  }

  console.log(`${productsList.length} products created`);

  // Create sample expenses
  const expensesList = [
    {
      title: 'Office Rent',
      category: 'Operations',
      amount: 2500.00,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      notes: 'Monthly office rent',
    },
    {
      title: 'Inventory Restocking',
      category: 'Inventory',
      amount: 4800.00,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      notes: 'Electronics restock from supplier',
    },
    {
      title: 'Marketing Ads',
      category: 'Marketing',
      amount: 750.00,
      date: new Date(now.getFullYear(), now.getMonth(), 8),
      notes: 'Social media campaign',
    },
    {
      title: 'Shipping Supplies',
      category: 'Operations',
      amount: 320.00,
      date: new Date(now.getFullYear(), now.getMonth(), 12),
      notes: 'Boxes, tape, packaging materials',
    },
    {
      title: 'Staff Salaries',
      category: 'Payroll',
      amount: 8500.00,
      date: new Date(now.getFullYear(), now.getMonth(), 15),
      notes: 'Monthly payroll',
    },
  ];

  for (const expense of expensesList) {
    await db.insert(expenses).values(expense);
  }

  console.log(`${expensesList.length} expenses created`);

  // Create a welcome notification for admin
  await db.insert(notifications).values({
    userId: admin.id,
    title: 'Welcome to RetailHub',
    message: 'Your admin account is ready. Start managing your store!',
    type: 'INFO',
  });

  console.log('Seed completed successfully!');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
