import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        encrypted_api_key TEXT NOT NULL DEFAULT '',
        encryption_iv TEXT NOT NULL DEFAULT '',
        encryption_tag TEXT NOT NULL DEFAULT '',
        base_url TEXT NOT NULL DEFAULT 'https://routerai.ru/api/v1',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS interviews (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        question_count INTEGER NOT NULL DEFAULT 0,
        planned_question_count INTEGER NOT NULL DEFAULT 7,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        final_report JSONB
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        interview_id UUID NOT NULL REFERENCES interviews(id),
        role TEXT NOT NULL,
        text TEXT NOT NULL DEFAULT '',
        message_type TEXT NOT NULL DEFAULT 'question',
        question_number INTEGER,
        audio_reference TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS candidates (
        id UUID PRIMARY KEY,
        interview_id UUID UNIQUE REFERENCES interviews(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        role TEXT NOT NULL,
        experiance TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resume TEXT,
        hiring_recommendation TEXT
      );
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'candidates' AND column_name = 'experience'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'candidates' AND column_name = 'experiance'
        ) THEN
          ALTER TABLE candidates RENAME COLUMN experience TO experiance;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'candidates' AND column_name = 'interview_id'
        ) THEN
          ALTER TABLE candidates ADD COLUMN interview_id UUID UNIQUE REFERENCES interviews(id);
        END IF;
      END $$;
    `);

    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export default pool;