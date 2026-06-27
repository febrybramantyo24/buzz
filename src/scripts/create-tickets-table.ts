import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function run() {
  const { pool } = await import('../lib/db');
  console.log('Creating tickets and ticket_messages tables...');
  try {
    // Create tickets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ticket_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        sender_role TEXT NOT NULL,
        message TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
  }
}

run();
