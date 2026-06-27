import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Renaming column numeric_id to order_id...');
  try {
    await pool.query('ALTER TABLE orders RENAME COLUMN numeric_id TO order_id;');
    console.log('Column numeric_id renamed to order_id successfully!');
  } catch (err) {
    console.error('Error renaming column:', err);
  } finally {
    await pool.end();
  }
}

run();
