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

    // Validation matching registration rules
    if (!username || !fullName || !whatsapp) {
      return NextResponse.json({ error: 'Semua kolom data wajib diisi' }, { status: 400 });
    }

    if (fullName.trim().length < 3) {
      return NextResponse.json({ error: 'Nama Lengkap minimal 3 karakter' }, { status: 400 });
    }
    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      return NextResponse.json({ error: 'Nama Lengkap hanya boleh berisi huruf dan spasi' }, { status: 400 });
    }

    const usernameRegex = /^[a-z0-9_]{3,16}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ error: 'Username harus 3-16 karakter dan hanya boleh berisi huruf kecil, angka, dan underscore (_)' }, { status: 400 });
    }

    const whatsappClean = (whatsapp || '').replace('+', '');
    if (!/^[0-9]{9,15}$/.test(whatsappClean)) {
      return NextResponse.json({ error: 'Nomor Whatsapp harus berupa angka dengan panjang 9-15 digit' }, { status: 400 });
    }

    // Check if username is already taken by another user
    const usernameCheck = await query('SELECT id FROM profiles WHERE username = $1 AND id != $2', [username, decoded.userId]);
    if (usernameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh orang lain' }, { status: 400 });
    }

    // 3. Update database profiles
    await query(
      'UPDATE profiles SET username = $1, full_name = $2, whatsapp = $3 WHERE id = $4',
      [username, fullName, whatsapp, decoded.userId]
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
