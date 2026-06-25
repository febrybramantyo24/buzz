import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    // Find user with this verification token
    const userRes = await query('SELECT id FROM users WHERE verification_token = $1', [token]);

    if (userRes.rows.length === 0) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    const userId = userRes.rows[0].id;

    // Update user to verified and remove token
    await query(
      'UPDATE users SET is_verified = true, verification_token = null WHERE id = $1',
      [userId]
    );

    return NextResponse.redirect(new URL('/login?verified=true', request.url));

  } catch (err) {
    console.error('Error in verify route:', err);
    return NextResponse.redirect(new URL('/login?error=system_error', request.url));
  }
}
