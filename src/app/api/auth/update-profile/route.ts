import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
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
    const { username, fullName, whatsapp } = await request.json();

    // 3. Update database profiles
    await query(
      'UPDATE profiles SET username = $1, full_name = $2, whatsapp = $3 WHERE id = $4',
      [username || '', fullName || '', whatsapp || '', decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Profil Anda berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
