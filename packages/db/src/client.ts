/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost/termskit',
    });
    // Cast to any to handle pg version type mismatch
    _db = drizzle(pool as any, { schema });
  }
  return _db;
}
