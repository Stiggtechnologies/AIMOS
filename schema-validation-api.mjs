#!/usr/bin/env node
/**
 * AIMOS Schema Validation via Supabase REST API (Service Role)
 * Gets: columns, RLS policies, foreign keys, row counts, relationships
 */
import https from 'https';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NjI2MSwiZXhwIjoyMDgzNzcyMjYxfQ.DISM-4j8hspMUqxfqzL6uGnIR0b_uf51JW0WiUl32O0';
const PROJECT_REF = 'tfnoogotbyshsznpjspk';

const BASE_URL = `https://${PROJECT_REF}.supabase.co`;

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: PROJECT_REF + '.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    
    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(response);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: response });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getColumns(table) {
  const res = await request(`/rest/v1/?ref=public&table=${table}&columns=*&limit=0`);
  // Can't get column metadata this way - need to try different approaches
  
  // Try getting one row to see structure
  const rowRes = await request(`/rest/v1/${table}?limit=1&select=*`);
  if (rowRes.status === 200 && Array.isArray(rowRes.data) && rowRes.data.length > 0) {
    return Object.keys(rowRes.data[0]);
  }
  return [];
}

async function getRLSPolicies(table) {
  // RLS policies can be fetched via pg_catalog REST extension if available
  // Otherwise check via a raw SQL call
  const res = await request(`/rest/v1/rpc/pg_catalog_query`, 'POST', {
    query: `SELECT policyname, permissive, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = '${table}'`
  });
  return res;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('AIMOS Schema Validation - REST API Mode');
  console.log('═══════════════════════════════════════\n');
  
  // Target tables for asset management
  const tables = ['assets', 'work_orders', 'asset_documents', 'asset_categories'];
  
  for (const table of tables) {
    console.log(`\n--- ${table.toUpperCase()} ---`);
    
    // Get structure via one row sample
    const res = await request(`/rest/v1/${table}?limit=1&select=*`);
    
    if (res.status === 200 && Array.isArray(res.data)) {
      if (res.data.length > 0) {
        const cols = Object.keys(res.data[0]);
        console.log(`Columns (${cols.length}):`);
        cols.forEach(c => console.log(`  - ${c}`));
        
        // Get row count
        const countRes = await request(`/rest/v1/${table}?select=id&limit=1000`);
        if (countRes.status === 200 && Array.isArray(countRes.data)) {
          console.log(`Row count: ${countRes.data.length} (sample)`);
        }
      } else {
        console.log('Table exists but is empty');
        // Get columns by trying to get empty row with specific columns
        // Try via a RPC that returns column info
        const colInfoRes = await request(`/rest/v1/${table}?limit=0&select=*`);
        console.log(`Status: ${colInfoRes.status}`);
      }
    } else {
      console.log(`Table not found or error: ${JSON.stringify(res.data)}`);
    }
  }
  
  // Get all tables in public schema
  console.log('\n\n--- ALL PUBLIC TABLES ---');
  const allTablesRes = await request('/rest/v1/?ref=public');
  console.log(JSON.stringify(allTablesRes.data, null, 2).substring(0, 2000));
  
  // Try to get metadata via different approach - use the types endpoint
  console.log('\n\n--- TABLE INFO ---');
  for (const table of tables) {
    // Try SELECT with no rows to get column info
    const res = await request(`/rest/v1/${table}?limit=0`);
    console.log(`${table}: status=${res.status}`);
  }
  
  // Get foreign key info via RPC if available
  console.log('\n\n--- FOREIGN KEYS ---');
  const fkRes = await request('/rest/v1/rpc/pg_get_constraints', 'POST', {
    query: `SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f' AND conrelid::regclass::text LIKE 'assets%' OR conrelid::regclass::text LIKE 'work_orders%' OR conrelid::regclass::text LIKE 'asset_documents%'`
  });
  console.log('FK check status:', fkRes.status);
  if (fkRes.data) console.log(JSON.stringify(fkRes.data, null, 2).substring(0, 1000));
}

main().catch(console.error);