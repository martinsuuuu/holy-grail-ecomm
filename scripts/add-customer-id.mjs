import { readFileSync } from 'fs';

// Read DATABASE_URL from .env.local
const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
if (!dbUrl) { console.error('DATABASE_URL not found'); process.exit(1); }

const { default: postgres } = await import('./node_modules/postgres/src/index.js');
const sql = postgres(dbUrl, { ssl: 'require' });

try {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id text UNIQUE`;
  console.log('✓ customer_id column added successfully');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}
