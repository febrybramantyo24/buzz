import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Adding column is_recommended to services...');
  try {
    await pool.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;');
    console.log('Column is_recommended added successfully!');
  } catch (err) {
    console.error('Error adding column:', err);
  }
}

run();
