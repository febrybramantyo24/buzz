import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Checking orders table schema...');
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions';
    `);
    console.log(res.rows);
  } catch (err) {
    console.error('Error checking schema:', err);
  }
}

run();
