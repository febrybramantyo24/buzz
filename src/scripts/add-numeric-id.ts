import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Offsetting existing numeric_id and resetting sequence...');
  try {
    // 1. Update existing orders to have numeric_id starting from 10001
    // (If order was 1, it becomes 10001)
    await pool.query('UPDATE orders SET numeric_id = numeric_id + 10000 WHERE numeric_id <= 10000;');
    console.log('Existing numeric_ids offsetted by 10000!');

    // 2. Find the max numeric_id
    const { rows: maxRows } = await pool.query('SELECT MAX(numeric_id) as max_id FROM orders;');
    const maxId = maxRows[0].max_id || 10000;
    const nextVal = Number(maxId) + 1;

    // 3. Restart sequence with next val
    await pool.query(`ALTER SEQUENCE IF EXISTS orders_numeric_id_seq RESTART WITH ${nextVal};`);
    console.log(`Sequence restarted to ${nextVal} successfully!`);

    // 4. Print verification
    const { rows } = await pool.query('SELECT id, numeric_id FROM orders LIMIT 5;');
    console.log('Verify orders numeric IDs:', rows);
  } catch (err) {
    console.error('Error migrating orders table:', err);
  } finally {
    await pool.end();
  }
}

run();
