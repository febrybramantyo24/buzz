import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Adding column tx_id to transactions table...');
  try {
    // 1. Add tx_id column as SERIAL if not exists
    await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_id SERIAL UNIQUE;');
    console.log('Column tx_id created successfully!');

    // 2. Offset existing transactions by 10000
    await pool.query('UPDATE transactions SET tx_id = tx_id + 10000 WHERE tx_id <= 10000;');
    console.log('Existing tx_ids offsetted by 10000!');

    // 3. Find the max tx_id
    const { rows: maxRows } = await pool.query('SELECT MAX(tx_id) as max_id FROM transactions;');
    const maxId = maxRows[0].max_id || 10000;
    const nextVal = Number(maxId) + 1;

    // 4. Restart sequence with next val
    await pool.query(`ALTER SEQUENCE IF EXISTS transactions_tx_id_seq RESTART WITH ${nextVal};`);
    console.log(`Sequence restarted to ${nextVal} successfully!`);

    // 5. Print verification
    const { rows } = await pool.query('SELECT id, tx_id FROM transactions LIMIT 5;');
    console.log('Verify transactions tx IDs:', rows);
  } catch (err) {
    console.error('Error migrating transactions table:', err);
  } finally {
    await pool.end();
  }
}

run();
