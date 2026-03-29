import pg from 'pg';
const { Client } = pg;

// Try various connection combinations
const attempts = [
  { host: 'aws-1-us-east-1.pooler.supabase.com', port: 5432, user: 'postgres.tfnoogotbyshsznpjspk', password: '', database: 'postgres' },
  { host: 'db.tfnoogotbyshsznpjspk.supabase.co', port: 5432, user: 'postgres', password: '', database: 'postgres' },
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: 'postgres', password: '', database: 'postgres' },
];

for (const config of attempts) {
  console.log(`Trying: ${config.host}:${config.port} as ${config.user}...`);
  const client = new Client({
    ...config,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  
  try {
    await client.connect();
    console.log(`✓ Connected to ${config.host}!`);
    
    // Check existing tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'retail_%' OR table_name LIKE 'asset%'
    `);
    console.log('Existing tables:', result.rows.map(r => r.table_name).join(', ') || 'none');
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`✗ Failed: ${err.message.split('\n')[0]}`);
    try { await client.end().catch(() => {}); } catch {}
  }
}

console.log('\nCould not connect to database. Need connection string from Supabase dashboard.');
