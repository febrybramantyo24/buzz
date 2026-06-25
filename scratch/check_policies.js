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

const anonSupabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const testTx = {
    user_id: '9b39c282-90f4-4805-9db7-6ec20278b90e',
    amount: 15000,
    type: 'topup',
    status: 'pending',
    payment_method: 'midtrans'
  };

  const { data: insertData, error: insertError } = await anonSupabase
    .from('transactions')
    .insert(testTx)
    .select();

  console.log('Insert test result:', insertData, insertError);
}

run();
