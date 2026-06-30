import pkg from '@next/env';
const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  try {
    const ordersRes = await pool.query("SELECT id, user_id, status, payment_status, total_price FROM orders WHERE status = 'failed' OR payment_status = 'refunded' ORDER BY created_at DESC LIMIT 10");
    console.log('Orders found:', ordersRes.rows);

    const txsRes = await pool.query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10");
    console.log('Latest 10 Transactions:', txsRes.rows);

    const userRes = await pool.query("SELECT id, email, balance FROM profiles WHERE email = 'febrybramantyo24@gmail.com' OR email = 'febry24@gmail.com'");
    console.log('User profile:', userRes.rows);
  } catch (err) {
    console.error('Error running check script:', err);
  } finally {
    await pool.end();
  }
}

run();
