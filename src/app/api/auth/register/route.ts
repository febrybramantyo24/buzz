import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, password, username, fullName, whatsapp } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password tidak boleh kosong' }, { status: 400 });
    }

    const cleanUsername = username || email.split('@')[0];
    const cleanFullName = fullName || cleanUsername;

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

    // 4. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 5. Insert into users and profiles
    // We run them in a transaction or sequence
    const userRes = await query(
      `INSERT INTO users (email, password_hash, verification_token, is_verified) 
       VALUES ($1, $2, $3, false) RETURNING id`,
      [email, passwordHash, verificationToken]
    );

    const userId = userRes.rows[0].id;

    await query(
      `INSERT INTO profiles (id, email, role, full_name, username, whatsapp, balance) 
       VALUES ($1, $2, 'user', $3, $4, $5, 100000.00)`,
      [userId, email, cleanFullName, cleanUsername, whatsapp || '']
    );

    // 6. Send verification email
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const verifyUrl = `${origin}/api/auth/verify?token=${verificationToken}`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Selamat Datang di Buzzify!</h2>
        <p>Halo <strong>${fullName}</strong>,</p>
        <p>Terima kasih telah melakukan pendaftaran di Buzzify. Tinggal satu langkah lagi untuk mengaktifkan akun Anda.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verifikasi Akun Saya</a>
        </p>
        <p>Jika tombol di atas tidak berfungsi, silakan salin dan tempel link berikut ke browser Anda:</p>
        <p style="word-break: break-all; color: #4f46e5;">${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Ini adalah email otomatis, mohon tidak membalas email ini.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Verifikasi Akun Buzzify Anda',
      html: emailHtml
    });

    return NextResponse.json({
      success: true,
      userId: userId,
      message: 'Registrasi berhasil! Silakan cek email Anda untuk melakukan verifikasi akun.'
    });

  } catch (err: any) {
    console.error('Error in register route:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
