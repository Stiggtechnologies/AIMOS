import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
const SEED_NAME = process.env.SEED_NAME || 'Starter Pack Bundle v1';
const SQL_FILE = process.env.SQL_FILE || 'seed_bundle.sql';

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Get it from Supabase Project Settings > Database > Connection String (URI)');
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    const sqlPath = path.resolve(process.cwd(), SQL_FILE);
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at ${sqlPath}`);
    }
    const seedSql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📦 Loading seed: ${SEED_NAME}`);
    console.log(`📄 SQL file: ${sqlPath}`);

    await client.query('BEGIN');

    // Check if this seed was already applied
    const existing = await client.query(
      `SELECT 1 FROM public.evidence_version_sets WHERE name = $1 LIMIT 1`,
      [SEED_NAME]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`✅ Seed already applied (version set found): ${SEED_NAME}. Skipping.`);
      await client.query('ROLLBACK');
      return;
    }

    console.log('🚀 Applying seed (transaction started)...');

    // Create version set guard
    await client.query(
      `
      INSERT INTO public.evidence_version_sets (publisher, name, release_date, diff_summary)
      VALUES ('AIM OS', $1, current_date, '{}'::jsonb)
      `,
      [SEED_NAME]
    );

    console.log('📝 Executing SQL bundle...');

    // Execute entire SQL in one go (since it's in a transaction)
    await client.query(seedSql);

    await client.query('COMMIT');
    console.log(`✅ Seed applied successfully: ${SEED_NAME}`);
    console.log(`📊 Transaction committed`);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed. Rolled back.', err?.message ?? err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
