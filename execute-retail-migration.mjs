#!/usr/bin/env node
/**
 * AIMOS Retail Schema Migration
 * Uses Supabase service role key to create tables
 */

import https from 'https';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NjI2MSwiZXhwIjoyMDgzNzcyMjYxfQ.DISM-4j8hspMUqxfqzL6uGnIR0b_uf51JW0WiUl32O0';
const SUPABASE_URL = 'tfnoogotbyshsznpjspk.supabase.co';

function request(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    
    const req = https.request(options, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        try {
          const parsed = response ? JSON.parse(response) : {};
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

async function checkTableExists(tableName) {
  const result = await request(
    `/rest/v1/${tableName}?limit=1&select=id`,
    'GET'
  );
  return result.status === 200;
}

async function main() {
  console.log('🚀 SyncAI AIMOS Retail Schema Migration\n');
  
  // Check existing tables
  console.log('📋 Checking existing tables...');
  const tables = ['retail_products', 'retail_orders', 'retail_order_items', 'product_recommendations', 'product_outcomes'];
  const existing = [];
  
  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) existing.push(table);
    console.log(`  ${exists ? '✓' : '✗'} ${table}`);
  }
  
  if (existing.length === tables.length) {
    console.log('\n✅ All tables already exist! Nothing to do.');
    return;
  }
  
  console.log(`\n📦 Creating ${tables.length - existing.length} missing tables...`);
  
  // Since we can't run DDL via REST API, we'll note what needs to be done
  console.log('\n⚠️  Direct DDL requires PostgreSQL connection.');
  console.log('\n📝 Tables to create via SQL Editor:');
  console.log('   https://tfnoogotbyshsznpjspk.supabase.co/project/-/sql\n');
  
  console.log('Or provide the service role key to execute automatically.');
}

main().catch(console.error);
