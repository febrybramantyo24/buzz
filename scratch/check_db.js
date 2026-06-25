const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: txs, error: txError } = await supabase.from('transactions').select('*');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  console.log('--- DB CHECK ---');
  console.log('Transactions error:', txError);
  console.log('Transactions count:', txs ? txs.length : 0);
  console.log('Transactions:', txs);
  console.log('Profiles error:', pError);
  console.log('Profiles:', profiles);
}

run();
