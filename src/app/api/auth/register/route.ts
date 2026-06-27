import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, password, username, fullName, whatsapp } = await request.json();

    if (!email || !password || !username || !fullName) {
      return NextResponse.json({ error: 'Semua kolom data registrasi wajib diisi' }, { status: 400 });
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    const whatsappClean = (whatsapp || '').replace('+', '');
    if (!/^[0-9]{9,15}$/.test(whatsappClean)) {
      return NextResponse.json({ error: 'Nomor Whatsapp harus berupa angka dengan panjang 9-15 digit' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const cleanUsername = username;
    const cleanFullName = fullName;

    // 1. Check if email already exists
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // 2. Check if username already exists
    const usernameCheck = await query('SELECT id FROM profiles WHERE username = $1', [cleanUsername]);
    if (usernameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh orang lain' }, { status: 400 });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert into users and profiles
    const userRes = await query(
      `INSERT INTO users (email, password_hash, is_verified) 
       VALUES ($1, $2, true) RETURNING id`,
      [email, passwordHash]
    );

    const userId = userRes.rows[0].id;

    await query(
      `INSERT INTO profiles (id, email, role, full_name, username, whatsapp, balance) 
       VALUES ($1, $2, 'user', $3, $4, $5, 0.00)`,
      [userId, email, cleanFullName, cleanUsername, whatsapp || '']
    );

    return NextResponse.json({
      success: true,
      userId: userId,
      message: 'Registrasi berhasil! Silakan langsung login dengan akun Anda.'
    });

  } catch (err: any) {
    console.error('Error in register route:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
