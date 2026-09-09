import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCHEMA_FILE = path.join(process.cwd(), 'server', 'db', 'schema.sql');

async function migrate() {
  console.log('Starting PostgreSQL initialization...');

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set in environment variables.');
    process.exit(1);
  }

  try {
    // 1. Create Schema
    console.log('Creating schema...');
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    await pool.query(schemaSql);
    console.log('Schema created successfully.');

    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
