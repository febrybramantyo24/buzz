import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Running referral migrations...');
  try {
    // 1. Add referred_by to profiles referencing profiles(id)
    await pool.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    `);
    console.log('referred_by column checked/added to profiles.');

    // 2. Add referral_code to profiles
    await pool.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS referral_code VARCHAR(100) UNIQUE;
    `);
    console.log('referral_code column checked/added to profiles.');

    // 3. Populate existing users' referral_codes if NULL
    const usersRes = await pool.query(`SELECT id, username FROM profiles WHERE referral_code IS NULL`);
    for (const u of usersRes.rows) {
      const code = u.username ? u.username.toLowerCase() : `user-${u.id.slice(0, 8)}`;
      // Make sure the code is unique, if not add a small random suffix
      try {
        await pool.query(`UPDATE profiles SET referral_code = $1 WHERE id = $2`, [code, u.id]);
      } catch (err) {
        const uniqueCode = `${code}-${Math.floor(100 + Math.random() * 900)}`;
        await pool.query(`UPDATE profiles SET referral_code = $1 WHERE id = $2`, [uniqueCode, u.id]);
      }
    }
    console.log('Existing profiles populated with referral codes.');

    // 4. Create referral_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_logs (
        id SERIAL PRIMARY KEY,
        referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        deposit_id UUID,
        deposit_amount DECIMAL(15, 2) NOT NULL,
        commission_amount DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('referral_logs table created.');

    // 5. Insert default settings in site_settings if not present
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('referral_enabled', 'true')
      ON CONFLICT (key) DO NOTHING;
    `);
    await pool.query(`
      INSERT INTO site_settings (key, value)
      VALUES ('referral_commission_percent', '5')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Default referral settings initialized in site_settings.');

    console.log('Referral migrations completed successfully!');
  } catch (err) {
    console.error('Error during referral migrations:', err);
  } finally {
    await pool.end();
  }
}

run();
