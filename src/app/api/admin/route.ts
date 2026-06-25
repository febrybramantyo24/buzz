import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize server-side Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    // Authenticate user with their token
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify if user is admin in profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Bypass check in local development if profile table isn't fully configured
    const isAdmin = profile?.role === 'admin' || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch profiles first
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const profilesList = profiles || [];

    // Fetch all data using admin client to bypass RLS policies
    const { data: ordersData } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: transactionsData } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Join profiles manually in JS
    const orders = (ordersData || []).map(order => {
      const prof = profilesList.find(p => p.id === order.user_id);
      return {
        ...order,
        profiles: prof ? { email: prof.email } : null
      };
    });

    const transactions = (transactionsData || []).map(tx => {
      const prof = profilesList.find(p => p.id === tx.user_id);
      return {
        ...tx,
        profiles: prof ? { email: prof.email } : null
      };
    });

    return NextResponse.json({
      orders: orders,
      transactions: transactions,
      profiles: profilesList
    });

  } catch (err: any) {
    console.error('Error in Admin API route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
