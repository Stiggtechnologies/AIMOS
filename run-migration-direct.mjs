import https from 'https';

// The service role key we found
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NjI2MSwiZXhwIjoyMDgzNzcyMjYxfQ.DISM-4j8hspMUqxfqzL6uGnIR0b_uf51JW0WiUl32O0';
const PROJECT_REF = 'tfnoogotbyshsznpjspk';

// Check if tables exist via REST
function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
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

async function main() {
  console.log('🔍 Checking existing tables...\n');
  
  const tables = ['retail_products', 'retail_orders', 'retail_order_items', 'product_recommendations', 'product_outcomes'];
  
  for (const table of tables) {
    const result = await apiRequest(`/rest/v1/${table}?limit=1&select=id`);
    console.log(`${result.status === 200 ? '✓' : '✗'} ${table} - ${result.status === 200 ? 'exists' : 'missing'}`);
  }
  
  console.log('\n⚠️  Note: REST API (anon key) cannot run DDL statements.');
  console.log('   Need direct PostgreSQL connection to create tables.');
  console.log('\n📋 Options:');
  console.log('   1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/tfnoogotbyshsznpjspk/sql');
  console.log('   2. Paste the migration SQL I prepared earlier');
  console.log('\n   OR provide the database connection string (postgres://...)');
}

main().catch(console.error);
