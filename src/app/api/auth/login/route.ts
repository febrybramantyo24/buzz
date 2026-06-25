import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/username dan password tidak boleh kosong' }, { status: 400 });
    }

    let userEmail = email;
    let userId = '';

    // 1. Resolve email if user entered username
    if (!email.includes('@')) {
      const profileCheck = await query('SELECT id, email FROM profiles WHERE username = $1', [email]);
      if (profileCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Username tidak terdaftar' }, { status: 404 });
      }
      userEmail = profileCheck.rows[0].email;
      userId = profileCheck.rows[0].id;
    }

    // 2. Fetch user from users table
    const userQuery = userId 
      ? await query('SELECT * FROM users WHERE id = $1', [userId])
      : await query('SELECT * FROM users WHERE email = $1', [userEmail]);

    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    const user = userQuery.rows[0];

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 400 });
    }

    // 4. Verify account status
    if (!user.is_verified) {
      return NextResponse.json({ 
        error: 'Akun Anda belum diverifikasi. Silakan cek email Anda untuk memverifikasi akun sebelum login.' 
      }, { status: 400 });
    }

    // 5. Get user profile details
    const profileQuery = await query('SELECT role, username FROM profiles WHERE id = $1', [user.id]);
    const profile = profileQuery.rows[0] || { role: 'user', username: '' };

    // 6. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: profile.role,
        username: profile.username
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 7. Create Response and set httpOnly Cookie
    const response = NextResponse.json({
      success: true,
      session: {
        user: {
          id: user.id,
          email: user.email,
          role: profile.role,
        },
        access_token: token,
      }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (err: any) {
    console.error('Error in login route:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
