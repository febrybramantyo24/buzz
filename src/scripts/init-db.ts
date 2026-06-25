import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

async function initDb() {
  // Dynamically import to ensure environment variables are loaded first
  const { pool } = await import('../lib/db');
  
  console.log('Initializing database...');
  
  try {
    // Read schema.sql
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run schema
    console.log('Creating tables...');
    await pool.query(schemaSql);
    console.log('Tables created successfully.');

    // Check if admin user exists, if not create one
    const adminEmail = 'admin@sosialbuzz.com';
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (adminCheck.rows.length === 0) {
      console.log('Seeding admin user...');
      const passwordHash = await bcrypt.hash('adminpassword', 10);
      
      // Insert user
      const userRes = await pool.query(
        `INSERT INTO users (email, password_hash, is_verified) 
         VALUES ($1, $2, $3) RETURNING id`,
        [adminEmail, passwordHash, true]
      );
      
      const userId = userRes.rows[0].id;

      // Insert profile
      await pool.query(
        `INSERT INTO profiles (id, email, role, full_name, username, whatsapp, balance) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, adminEmail, 'admin', 'Administrator', 'admin', '081234567890', 10000000.00]
      );
      console.log('Admin user seeded (Email: admin@sosialbuzz.com, Password: adminpassword)');
    }

    // Check if services are empty, seed them if they are
    const servicesCheck = await pool.query('SELECT id FROM services LIMIT 1');
    if (servicesCheck.rows.length === 0) {
      console.log('Seeding default services...');
      const defaultServices = [
        {
          category: 'Instagram',
          name: 'Instagram Followers Indonesia [Real Aktif]',
          price_per_k: 45000,
          min_order: 100,
          max_order: 10000,
          description: 'Followers real aktif Indonesia. Kecepatan proses sedang, garansi refill 30 hari.'
        },
        {
          category: 'Instagram',
          name: 'Instagram Likes Indo [Sangat Cepat]',
          price_per_k: 12000,
          min_order: 50,
          max_order: 5000,
          description: 'Likes dari akun Indonesia. Proses sangat cepat, masuk secara instant.'
        },
        {
          category: 'TikTok',
          name: 'TikTok Followers [Real & Permanent]',
          price_per_k: 65000,
          min_order: 100,
          max_order: 20000,
          description: 'Followers TikTok real dan permanen. Aman 100% tanpa password.'
        },
        {
          category: 'TikTok',
          name: 'TikTok Views Video [Instant]',
          price_per_k: 3000,
          min_order: 500,
          max_order: 100000,
          description: 'Views video TikTok instant. Sangat cocok untuk menaikkan engagement konten Anda.'
        },
        {
          category: 'YouTube',
          name: 'YouTube Subscribers [Permanent - No Drop]',
          price_per_k: 280000,
          min_order: 50,
          max_order: 2000,
          description: 'Subscribers YouTube permanen non-drop. Bergaransi penuh.'
        },
        {
          category: 'YouTube',
          name: 'YouTube Watch Time hours [Safe 100%]',
          price_per_k: 180000,
          min_order: 100,
          max_order: 4000,
          description: 'Jam tayang YouTube aman 100%. Membantu syarat monetisasi channel Anda.'
        }
      ];

      for (const service of defaultServices) {
        await pool.query(
          `INSERT INTO services (category, name, price_per_k, min_order, max_order, description) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [service.category, service.name, service.price_per_k, service.min_order, service.max_order, service.description]
        );
      }
      console.log('Default services seeded.');
    }

    // Check if announcements are empty, seed them if they are
    const announcementsCheck = await pool.query('SELECT id FROM announcements LIMIT 1');
    if (announcementsCheck.rows.length === 0) {
      console.log('Seeding announcements...');
      await pool.query(
        `INSERT INTO announcements (title, content, badge, is_active) 
         VALUES ($1, $2, $3, $4)`,
        [
          '🔥 Diskon Kilat YouTube Subscribers!',
          'Dapatkan potongan harga khusus untuk Layanan YouTube Subscribers Permanent hingga akhir pekan ini. Stok terbatas!',
          'RECOMMENDED',
          true
        ]
      );
      await pool.query(
        `INSERT INTO announcements (title, content, badge, is_active) 
         VALUES ($1, $2, $3, $4)`,
        [
          '⚡ Update Sistem Pembayaran QRIS',
          'Sekarang pembayaran menggunakan QRIS diproses secara otomatis & real-time. Saldo/status orderan Anda langsung terupdate.',
          'HOT',
          true
        ]
      );
      console.log('Announcements seeded.');
    }

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    await pool.end();
  }
}

initDb();
