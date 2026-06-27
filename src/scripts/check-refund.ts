import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  try {
    const ordersRes = await pool.query("SELECT id, user_id, status, payment_status, total_price FROM orders WHERE id::text LIKE '66ad89ca%' OR status = 'failed'");
    console.log('Orders found:', ordersRes.rows);

    const txsRes = await pool.query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5");
    console.log('Latest 5 Transactions:', txsRes.rows);

    if (ordersRes.rows.length > 0) {
      const userId = ordersRes.rows[0].user_id;
      const userRes = await pool.query("SELECT id, email, balance FROM profiles WHERE id = $1", [userId]);
      console.log('User profile:', userRes.rows);
    }
  } catch (err) {
    console.error('Error running check script:', err);
  } finally {
    await pool.end();
  }
}

run();
