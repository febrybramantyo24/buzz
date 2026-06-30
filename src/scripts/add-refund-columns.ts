import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Adding refund columns to orders...');
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_refund_amount DECIMAL(15, 2) DEFAULT 0.00;');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);');
    console.log('Columns added successfully!');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    await pool.end();
  }
}

run();
