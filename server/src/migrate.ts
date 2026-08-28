import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    // При запуске из dist (Docker) __dirname = /app/dist, при tsx (локально) = server/src
    const sqlPath = path.resolve(__dirname, '..', 'db', 'migrations', '001_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    await client.query(sql);
    console.log('Database migration applied successfully');
  } catch (err) {
    console.error('Database migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();