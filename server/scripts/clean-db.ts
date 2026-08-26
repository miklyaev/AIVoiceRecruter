import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    if (rows.length === 0) {
      console.log('No tables found in the public schema.');
      await client.query('COMMIT');
      return;
    }

    const tableNames = rows.map((r) => r.tablename).join(', ');
    await client.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);

    await client.query('COMMIT');
    console.log(`Database cleaned. Truncated tables: ${tableNames}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to clean database:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();