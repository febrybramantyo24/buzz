import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email tidak boleh kosong' }, { status: 400 });
    }

    // 1. Check if user exists
    const userQuery = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      // Return success even if email not found to prevent user enumeration (best practice)
      return NextResponse.json({
        success: true,
        message: 'Link reset password telah dikirim ke email Anda jika terdaftar.'
      });
    }

    const userId = userQuery.rows[0].id;

    // 2. Generate reset token and expiration (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // 3. Save to database
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, userId]
    );

    // 4. Send email
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${origin}/login?tab=reset&token=${resetToken}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Atur Ulang Password Anda</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mengatur ulang password akun SosialBuzz Anda. Silakan klik tombol di bawah ini untuk melanjutkan:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Atur Ulang Password</a>
        </p>
        <p>Link ini berlaku selama 1 jam. Jika Anda tidak merasa meminta hal ini, silakan abaikan email ini.</p>
        <p>Jika tombol di atas tidak berfungsi, silakan salin dan tempel link berikut ke browser Anda:</p>
        <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Ini adalah email otomatis, mohon tidak membalas email ini.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Atur Ulang Password SosialBuzz Anda',
      html: emailHtml
    });

    return NextResponse.json({
      success: true,
      message: 'Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk.'
    });

  } catch (err: any) {
    console.error('Error in forgot password route:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
