import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Adding support ticket columns to tickets table...');
  try {
    await pool.query(`
      ALTER TABLE tickets 
      ADD COLUMN IF NOT EXISTS order_id TEXT,
      ADD COLUMN IF NOT EXISTS request_type TEXT,
      ADD COLUMN IF NOT EXISTS deposit_id TEXT;
    `);
    console.log('Support ticket columns added successfully!');
  } catch (err) {
    console.error('Error adding support ticket columns:', err);
  }
}

run();
