import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { getProviderServices } from '@/lib/buzzerpanel';
import { getMedanPediaServices } from '@/lib/medanpedia';

export async function GET(request: Request) {
  try {
    // 1. Authenticate user and verify admin role
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const profileRes = await query("SELECT role FROM profiles WHERE id = $1", [decoded.userId]);
    if (profileRes.rows.length === 0 || profileRes.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Read query parameter for provider selection
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'buzzerpanel';

    // 2. Fetch services from SMM Provider
    let providerRes;
    if (provider === 'medanpedia') {
      providerRes = await getMedanPediaServices();
    } else {
      providerRes = await getProviderServices();
    }

    if (!providerRes.status) {
      return NextResponse.json({ 
        error: providerRes.data?.msg || `Gagal mengambil data layanan dari provider ${provider}. Cek kredensial .env Anda.` 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      services: providerRes.data
    });

  } catch (err: any) {
    console.error('Error in provider-services route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
