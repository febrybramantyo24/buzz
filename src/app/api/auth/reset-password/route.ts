import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token dan password baru harus diisi' }, { status: 400 });
    }

    // 1. Find user with valid and unexpired reset token
    const userQuery = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'Token reset password tidak valid atau sudah kedaluwarsa' }, { status: 400 });
    }

    const userId = userQuery.rows[0].id;

    // 2. Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Update password and clear reset token info
    await query(
      'UPDATE users SET password_hash = $1, reset_token = null, reset_token_expires = null WHERE id = $2',
      [passwordHash, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password Anda berhasil diperbarui! Silakan login dengan password baru.'
    });

  } catch (err: any) {
    console.error('Error in reset password route:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
