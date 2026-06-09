import { createClient } from '@libsql/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// In production we point at Turso (libSQL) via env vars; locally we fall back to
// a plain SQLite file so `npm run dev` needs no cloud setup.
const url = process.env.TURSO_DATABASE_URL || `file:${join(__dirname, 'expense_tracker.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(authToken ? { url, authToken } : { url });

// Build a plain object from a libSQL row using the result's column names,
// converting BigInt integer columns to Number so the rest of the app is unchanged.
function rowToObject(row, columns) {
  const obj = {};
  for (let i = 0; i < columns.length; i++) {
    const value = row[i];
    obj[columns[i]] = typeof value === 'bigint' ? Number(value) : value;
  }
  return obj;
}

/** Run a query and return the first row (or undefined). */
export async function get(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows.length ? rowToObject(res.rows[0], res.columns) : undefined;
}

/** Run a query and return all rows. */
export async function all(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows.map((row) => rowToObject(row, res.columns));
}

/** Run a write and return { changes, lastInsertRowid }. */
export async function run(sql, args = []) {
  const res = await client.execute({ sql, args });
  return {
    changes: Number(res.rowsAffected ?? 0),
    lastInsertRowid: res.lastInsertRowid != null ? Number(res.lastInsertRowid) : undefined,
  };
}

/** Run a multi-statement SQL script (used by migrations). */
export async function execMultiple(sql) {
  await client.executeMultiple(sql);
}

/** Run several writes atomically. statements: [{ sql, args }] */
export async function batch(statements) {
  return client.batch(statements, 'write');
}

export default client;
