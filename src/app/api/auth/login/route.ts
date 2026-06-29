import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

// --- Rate Limiter (In-Memory) ---
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Clean up every 10 minutes

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, AttemptRecord>();

// Periodic cleanup of expired records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      loginAttempts.delete(key);
    } else if (now - record.firstAttempt > LOCKOUT_DURATION_MS * 2) {
      loginAttempts.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    const now = Date.now();

    // Check rate limit
    const record = loginAttempts.get(clientIP);
    if (record?.lockedUntil) {
      if (now < record.lockedUntil) {
        const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return NextResponse.json({
          error: `Terlalu banyak percobaan login gagal. Silakan tunggu ${remainingSeconds} detik sebelum mencoba lagi.`,
          retryAfter: remainingSeconds
        }, { status: 429 });
      } else {
        // Lockout expired, reset
        loginAttempts.delete(clientIP);
      }
    }

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
        recordFailedAttempt(clientIP);
        const attemptsLeft = getRemainingAttempts(clientIP);
        return NextResponse.json({
          error: `Username tidak terdaftar. Sisa percobaan: ${attemptsLeft}x`,
          attemptsLeft
        }, { status: 404 });
      }
      userEmail = profileCheck.rows[0].email;
      userId = profileCheck.rows[0].id;
    }

    // 2. Fetch user from users table
    const userQuery = userId
      ? await query('SELECT * FROM users WHERE id = $1', [userId])
      : await query('SELECT * FROM users WHERE email = $1', [userEmail]);

    if (userQuery.rows.length === 0) {
      recordFailedAttempt(clientIP);
      const attemptsLeft = getRemainingAttempts(clientIP);
      return NextResponse.json({
        error: `Akun tidak ditemukan. Sisa percobaan: ${attemptsLeft}x`,
        attemptsLeft
      }, { status: 404 });
    }

    const user = userQuery.rows[0];

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      recordFailedAttempt(clientIP);
      const attemptsLeft = getRemainingAttempts(clientIP);

      if (attemptsLeft <= 0) {
        return NextResponse.json({
          error: `Terlalu banyak percobaan login gagal. Akun dikunci selama 2 menit.`,
          retryAfter: Math.ceil(LOCKOUT_DURATION_MS / 1000)
        }, { status: 429 });
      }

      return NextResponse.json({
        error: `Password salah. Sisa percobaan: ${attemptsLeft}x sebelum akun dikunci sementara.`,
        attemptsLeft
      }, { status: 400 });
    }

    // 4. Verify account status
    if (!user.is_verified) {
      return NextResponse.json({
        error: 'Akun Anda belum diverifikasi. Silakan cek email Anda untuk memverifikasi akun sebelum login.'
      }, { status: 400 });
    }

    // Login success — clear failed attempts
    loginAttempts.delete(clientIP);

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
    const isHttps = request.url.startsWith('https://');
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction && isHttps,
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

// --- Helper Functions ---
function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now, lockedUntil: null });
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS;
    }
    loginAttempts.set(ip, record);
  }
}

function getRemainingAttempts(ip: string): number {
  const record = loginAttempts.get(ip);
  if (!record) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}
