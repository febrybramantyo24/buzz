import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Get token from cookies or Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization') || '';
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // 2. Verify token
    const jwtSecret = process.env.JWT_SECRET || 'sosialbuzz_secret_key_1234567890';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // 3. Verify user still exists in DB
    const userQuery = await query('SELECT id, email FROM users WHERE id = $1', [decoded.userId]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const user = userQuery.rows[0];
    
    // 4. Fetch latest profile information
    const profileQuery = await query('SELECT role, username FROM profiles WHERE id = $1', [user.id]);
    const profile = profileQuery.rows[0] || { role: 'user', username: '' };

    return NextResponse.json({
      session: {
        user: {
          id: user.id,
          email: user.email,
          role: profile.role,
        },
        access_token: token,
      }
    });

  } catch (err: any) {
    console.error('Error in session route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
