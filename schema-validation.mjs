#!/usr/bin/env node
/**
 * AIMOS Full Schema Validation - Direct PostgreSQL Query
 */
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.optlghedswctsklcxlkn',
  database: 'postgres',
  password: '', // Supabase pooled connection - no password needed
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('🔌 Connecting to AIMOS database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // ========== CHECK 1: SCHEMA - All Tables ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 1: SCHEMA - All Public Tables');
    console.log('═══════════════════════════════════════\n');
    
    const tables = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Found ${tables.rows.length} tables/objects:\n`);
    for (const t of tables.rows) {
      console.log(`  - ${t.table_name} (${t.table_type})`);
    }
    console.log();

    // ========== CHECK 2: ASSETS TABLE ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 2: assets TABLE - Full Schema');
    console.log('═══════════════════════════════════════\n');
    
    const assetsCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'assets'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    for (const c of assetsCols.rows) {
      const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      console.log(`  ${c.column_name.padEnd(35)} ${c.data_type.padEnd(20)} ${nullable}${def}`);
    }
    
    // Foreign keys for assets
    const assetsFK = await client.query(`
      SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid)
      FROM pg_constraint WHERE contype = 'f' AND conrelid = 'assets'::regclass
    `);
    if (assetsFK.rows.length > 0) {
      console.log('\nForeign Keys:');
      for (const fk of assetsFK.rows) {
        console.log(`  ${fk.conname} → ${fk.confrelid}`);
      }
    }
    
    // Indexes for assets
    const assetsIdx = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'assets'
    `);
    if (assetsIdx.rows.length > 0) {
      console.log('\nIndexes:');
      for (const idx of assetsIdx.rows) {
        console.log(`  ${idx.indexname}`);
      }
    }
    console.log();

    // ========== CHECK 3: WORK_ORDERS TABLE ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 3: work_orders TABLE - Full Schema');
    console.log('═══════════════════════════════════════\n');
    
    const woCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'work_orders'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    for (const c of woCols.rows) {
      const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      console.log(`  ${c.column_name.padEnd(35)} ${c.data_type.padEnd(20)} ${nullable}${def}`);
    }
    
    const woFK = await client.query(`
      SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid)
      FROM pg_constraint WHERE contype = 'f' AND conrelid = 'work_orders'::regclass
    `);
    if (woFK.rows.length > 0) {
      console.log('\nForeign Keys:');
      for (const fk of woFK.rows) {
        console.log(`  ${fk.conname} → ${fk.confrelid}`);
      }
    }
    
    const woIdx = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'work_orders'
    `);
    if (woIdx.rows.length > 0) {
      console.log('\nIndexes:');
      for (const idx of woIdx.rows) {
        console.log(`  ${idx.indexname}`);
      }
    }
    console.log();

    // ========== CHECK 4: ASSET_DOCUMENTS TABLE ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 4: asset_documents TABLE - Full Schema');
    console.log('═══════════════════════════════════════\n');
    
    const adCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'asset_documents'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    for (const c of adCols.rows) {
      const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      console.log(`  ${c.column_name.padEnd(35)} ${c.data_type.padEnd(20)} ${nullable}${def}`);
    }
    
    const adFK = await client.query(`
      SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid)
      FROM pg_constraint WHERE contype = 'f' AND conrelid = 'asset_documents'::regclass
    `);
    if (adFK.rows.length > 0) {
      console.log('\nForeign Keys:');
      for (const fk of adFK.rows) {
        console.log(`  ${fk.conname} → ${fk.confrelid}`);
      }
    }
    
    const adIdx = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'asset_documents'
    `);
    if (adIdx.rows.length > 0) {
      console.log('\nIndexes:');
      for (const idx of adIdx.rows) {
        console.log(`  ${idx.indexname}`);
      }
    }
    console.log();

    // ========== CHECK 5: ASSET_CATEGORIES TABLE ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 5: asset_categories TABLE - Full Schema');
    console.log('═══════════════════════════════════════\n');
    
    const acCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'asset_categories'
      ORDER BY ordinal_position
    `);
    
    if (acCols.rows.length > 0) {
      console.log('Columns:');
      for (const c of acCols.rows) {
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
        console.log(`  ${c.column_name.padEnd(35)} ${c.data_type.padEnd(20)} ${nullable}${def}`);
      }
    } else {
      console.log('  (table does not exist)');
    }
    console.log();

    // ========== CHECK 6: ALL FOREIGN KEYS ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 6: All Foreign Keys in Schema');
    console.log('═══════════════════════════════════════\n');
    
    const allFK = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    if (allFK.rows.length > 0) {
      for (const fk of allFK.rows) {
        console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      }
    } else {
      console.log('  (no foreign keys found)');
    }
    console.log();

    // ========== CHECK 7: RLS POLICIES ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 7: Row Level Security Policies');
    console.log('═══════════════════════════════════════\n');
    
    const rls = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);
    
    if (rls.rows.length > 0) {
      for (const p of rls.rows) {
        console.log(`Table: ${p.tablename}`);
        console.log(`  Policy: ${p.policyname} | ${p.permissive} | roles: ${p.roles} | cmd: ${p.cmd}`);
        console.log(`  USING: ${p.qual || '(none)'}`);
        console.log(`  WITH CHECK: ${p.with_check || '(none)'}`);
        console.log();
      }
    } else {
      console.log('  (no RLS policies found)');
    }
    console.log();

    // ========== CHECK 8: TRIGGERS ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 8: Triggers (Function Events)');
    console.log('═══════════════════════════════════════\n');
    
    const triggers = await client.query(`
      SELECT 
        t.tgname,
        c.relname AS table_name,
        p.proname AS function_name,
        t.tgtype,
        t.tgenabled,
        pg_get_triggerdef(t.oid) as trigger_def
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE NOT t.tgisinternal
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY c.relname, t.tgname
    `);
    
    if (triggers.rows.length > 0) {
      for (const tg of triggers.rows) {
        console.log(`${tg.table_name}.${tg.tgname} → ${tg.function_name}()`);
        console.log(`  Def: ${tg.trigger_def}`);
        console.log();
      }
    } else {
      console.log('  (no triggers found)');
    }
    console.log();

    // ========== CHECK 9: SEQUENCES ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 9: Sequences');
    console.log('═══════════════════════════════════════\n');
    
    const seqs = await client.query(`
      SELECT sequence_name, sequence_owner
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);
    
    if (seqs.rows.length > 0) {
      for (const s of seqs.rows) {
        console.log(`  ${s.sequence_name} (owner: ${s.sequence_owner || 'none'})`);
      }
    } else {
      console.log('  (no sequences found)');
    }
    console.log();

    // ========== CHECK 10: ALL INDEXES ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 10: All Indexes in Schema');
    console.log('═══════════════════════════════════════\n');
    
    const idxs = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    if (idxs.rows.length > 0) {
      for (const idx of idxs.rows) {
        console.log(`  ${idx.tablename}.${idx.indexname}`);
      }
    } else {
      console.log('  (no indexes found)');
    }
    console.log();

    // ========== CHECK 11: VIEWS ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 11: Views');
    console.log('═══════════════════════════════════════\n');
    
    const views = await client.query(`
      SELECT table_name, view_definition
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (views.rows.length > 0) {
      for (const v of views.rows) {
        const def = v.view_definition ? v.view_definition.substring(0, 500) : '(empty)';
        console.log(`  ${v.table_name}:`);
        console.log(`    ${def}...`);
      }
    } else {
      console.log('  (no views found)');
    }
    console.log();

    // ========== CHECK 12: ROW COUNTS ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 12: Row Counts');
    console.log('═══════════════════════════════════════\n');
    
    const tablesToCount = ['assets', 'work_orders', 'asset_documents', 'asset_categories'];
    for (const tbl of tablesToCount) {
      try {
        const cnt = await client.query(`SELECT COUNT(*) as cnt FROM ${tbl}`);
        console.log(`  ${tbl}: ${cnt.rows[0].cnt} rows`);
      } catch (e) {
        console.log(`  ${tbl}: (table does not exist or error: ${e.message.split('\n')[0]})`);
      }
    }
    console.log();

    // ========== CHECK 13: sample assets data ==========
    console.log('═══════════════════════════════════════');
    console.log('CHECK 13: Sample Assets Data');
    console.log('═══════════════════════════════════════\n');
    
    const sample = await client.query(`
      SELECT * FROM assets LIMIT 1
    `);
    if (sample.rows.length > 0) {
      console.log('Asset columns:', Object.keys(sample.rows[0]).join(', '));
      console.log();
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    console.log();

    await client.end();
    console.log('✅ Validation complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end().catch(() => {}); } catch {}
    process.exit(1);
  }
}

run();