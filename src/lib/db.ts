import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/sosialbuzz',
  ssl: process.env.NODE_ENV === 'production' && !connectionString?.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Only log in dev mode or slow queries
  if (process.env.NODE_ENV === 'development' || duration > 100) {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}
