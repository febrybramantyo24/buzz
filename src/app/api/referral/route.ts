import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Get token from cookies or authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization') || '';
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // 2. Fetch referral system status & user referral code
    const systemStatusRes = await query("SELECT value FROM site_settings WHERE key = 'referral_enabled'");
    const referralEnabled = systemStatusRes.rows[0]?.value === 'true';

    const userProfileRes = await query("SELECT referral_code FROM profiles WHERE id = $1", [userId]);
    if (userProfileRes.rows.length === 0) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    const referralCode = userProfileRes.rows[0].referral_code;

    // 3. Fetch referrals statistics
    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*)::int FROM profiles WHERE referred_by = $1) as total_invited,
        (SELECT COALESCE(SUM(commission_amount), 0.00)::numeric FROM referral_logs WHERE referrer_id = $1) as total_earnings
    `, [userId]);

    const { total_invited, total_earnings } = statsRes.rows[0];

    // 4. Fetch list of invited friends
    const friendsRes = await query(`
      SELECT username, email, created_at 
      FROM profiles 
      WHERE referred_by = $1 
      ORDER BY created_at DESC
    `, [userId]);

    // 5. Fetch list of commission logs
    const logsRes = await query(`
      SELECT rl.id, rl.deposit_amount, rl.commission_amount, rl.created_at,
             p.username as referred_username, p.email as referred_email
      FROM referral_logs rl
      JOIN profiles p ON rl.referred_id = p.id
      WHERE rl.referrer_id = $1
      ORDER BY rl.created_at DESC
    `, [userId]);

    return NextResponse.json({
      referralEnabled,
      referralCode,
      stats: {
        totalInvited: total_invited || 0,
        totalEarnings: parseFloat(total_earnings || '0')
      },
      friends: friendsRes.rows,
      logs: logsRes.rows
    });

  } catch (err: any) {
    console.error('Error in referral API:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
