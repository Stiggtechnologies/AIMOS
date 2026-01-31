import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_NAME = process.env.SEED_NAME || 'Starter Pack Bundle v1';
const SQL_FILE = process.env.SQL_FILE || 'seed_bundle.sql';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const sqlPath = path.resolve(process.cwd(), SQL_FILE);
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at ${sqlPath}`);
    }
    const seedSql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📦 Loading seed: ${SEED_NAME}`);
    console.log(`📄 SQL file: ${sqlPath}`);

    // Check if this seed was already applied
    const { data: existing, error: checkError } = await supabase
      .from('evidence_version_sets')
      .select('id')
      .eq('name', SEED_NAME)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Failed to check existing seeds: ${checkError.message}`);
    }

    if (existing) {
      console.log(`✅ Seed already applied (version set found): ${SEED_NAME}. Skipping.`);
      return;
    }

    console.log('🚀 Applying seed...');

    // Create version set first
    const { error: versionError } = await supabase
      .from('evidence_version_sets')
      .insert({
        publisher: 'AIM OS',
        name: SEED_NAME,
        release_date: new Date().toISOString().split('T')[0],
        diff_summary: {}
      });

    if (versionError) {
      throw new Error(`Failed to create version set: ${versionError.message}`);
    }

    // Execute SQL using Supabase RPC or direct SQL execution
    // Note: For complex SQL with transactions, you may need to use the raw connection
    // For now, we'll execute statement by statement
    const statements = seedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.length === 0) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: stmt + ';' });
        if (error) {
          console.error(`❌ Failed at statement ${i + 1}:`, error.message);
          throw error;
        }

        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ Processed ${i + 1}/${statements.length} statements`);
        }
      } catch (err: any) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        throw err;
      }
    }

    console.log(`✅ Seed applied successfully: ${SEED_NAME}`);
    console.log(`📊 Executed ${statements.length} SQL statements`);
  } catch (err: any) {
    console.error('❌ Seed failed:', err?.message ?? err);
    process.exitCode = 1;
  }
}

main();
