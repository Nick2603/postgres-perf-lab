import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

// eslint-disable-next-line
expand(config());

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = await readFile(path.join(process.cwd(), 'db', 'seed.sql'), 'utf-8');

  const pool = new Pool({ connectionString: databaseUrl });

  console.log('Seeding database...');

  const start = Date.now();

  try {
    // A single multi-statement query over the simple query protocol --
    // node-postgres runs each ;-separated statement in order, and the
    // BEGIN/COMMIT inside seed.sql keeps the whole run atomic.
    await pool.query(sql);

    console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);

    const counts = await pool.query(`
      SELECT 'categories' AS table, count(*) FROM categories
      UNION ALL SELECT 'products', count(*) FROM products
      UNION ALL SELECT 'inventory', count(*) FROM inventory
      UNION ALL SELECT 'customers', count(*) FROM customers
      UNION ALL SELECT 'orders', count(*) FROM orders
      UNION ALL SELECT 'order_items', count(*) FROM order_items
      UNION ALL SELECT 'outbox', count(*) FROM outbox;
    `);
    console.table(counts.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);

  process.exit(1);
});
