/**
 * Run supabase/phalanx.sql against a Supabase Postgres database.
 *
 * Usage (one of):
 *   set DATABASE_URL=postgresql://postgres:...@db.PROJECT.supabase.co:5432/postgres
 *   node scripts/run-phalanx-sql.mjs
 *
 *   or:
 *   set SUPABASE_DB_PASSWORD=your-db-password
 *   set NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
 *   node scripts/run-phalanx-sql.mjs
 *
 * Loads .env.local automatically if present.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}

function resolveConnectionString() {
  if (process.env.DATABASE_URL?.startsWith('postgres')) {
    return process.env.DATABASE_URL;
  }
  if (process.env.SUPABASE_DB_URL?.startsWith('postgres')) {
    return process.env.SUPABASE_DB_URL;
  }

  const password = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const m = url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (password && m) {
    const ref = m[1];
    if (ref.includes('xxxx')) return null;
    // Direct connection (IPv6 may be required on some networks; pooler alternative below)
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

async function main() {
  loadEnvLocal();
  const sqlPath = path.join(ROOT, 'supabase', 'phalanx.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Missing supabase/phalanx.sql');
    process.exit(1);
  }

  const connectionString = resolveConnectionString();
  if (!connectionString) {
    console.error(`
No database connection available.

Your .env.local must include REAL values (not xxxxxxxx placeholders), plus one of:

  1) DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-....pooler.supabase.com:6543/postgres
     (from Supabase → Project Settings → Database → Connection string → URI)

  2) SUPABASE_DB_PASSWORD=...  and  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co

Or run the SQL manually:
  Supabase Dashboard → SQL Editor → paste supabase/phalanx.sql → Run
`);
    process.exit(1);
  }

  // Never print password
  const safe = connectionString.replace(/:([^:@/]+)@/, ':***@');
  console.log('Connecting to', safe);

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected. Running phalanx.sql …');
    await client.query(sql);
    console.log('OK — phalanx.sql applied successfully.');

    // Verify tables
    const { rows } = await client.query(`
      select table_name from information_schema.tables
      where table_schema = 'public'
        and table_name in ('phalanx_invites','phalanx_connections')
      order by table_name
    `);
    console.log(
      'Tables:',
      rows.map((r) => r.table_name).join(', ') || '(none found)'
    );

    const { rows: fns } = await client.query(`
      select routine_name from information_schema.routines
      where routine_schema = 'public'
        and routine_name in ('accept_phalanx_invite','get_phalanx_invite_preview')
      order by routine_name
    `);
    console.log(
      'Functions:',
      fns.map((r) => r.routine_name).join(', ') || '(none found)'
    );
  } catch (e) {
    console.error('SQL failed:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
