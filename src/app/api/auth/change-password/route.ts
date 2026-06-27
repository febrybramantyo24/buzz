import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user from session token
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization') || '';
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return NextResponse.json({ error: 'Sesi login kedaluwarsa. Silakan login kembali.' }, { status: 401 });
    }

    // 2. Parse request body
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password saat ini dan password baru harus diisi.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal harus 6 karakter.' }, { status: 400 });
    }

    // 3. Fetch user password hash
    const userQuery = await query('SELECT password_hash FROM users WHERE id = $1', [decoded.userId]);
    if (userQuery.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const user = userQuery.rows[0];

    // 4. Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Password saat ini yang Anda masukkan salah.' }, { status: 400 });
    }

    // 5. Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, decoded.userId]);

    return NextResponse.json({
      success: true,
      message: 'Password Anda berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Error changing password:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
