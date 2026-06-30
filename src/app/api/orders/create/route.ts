import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { placeProviderOrder } from '@/lib/buzzerpanel';
import { placeMedanPediaOrder } from '@/lib/medanpedia';

async function getSessionUser(request: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  if (!token) {
    const authHeader = request.headers.get('Authorization') || '';
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) return null;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    const decoded: any = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }
    const userId = sessionUser.userId;

    // 2. Parse request payload
    const body = await request.json();
    const { service_id, target_url, quantity, additionalParams } = body;

    if (!service_id || !target_url || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Parameter pesanan tidak lengkap atau tidak valid' }, { status: 400 });
    }

    // 3. Fetch service details from DB
    const serviceRes = await query(
      'SELECT id, category, name, price_per_k, min_order, max_order, provider_id, provider_service_id FROM services WHERE id = $1 AND is_active = true',
      [service_id]
    );

    if (serviceRes.rows.length === 0) {
      return NextResponse.json({ error: 'Layanan tidak ditemukan atau tidak aktif' }, { status: 404 });
    }

    const service = serviceRes.rows[0];

    // 4. Validate quantity limits
    if (quantity < service.min_order) {
      return NextResponse.json({ error: `Jumlah minimal pemesanan adalah ${service.min_order.toLocaleString()}` }, { status: 400 });
    }
    if (quantity > service.max_order) {
      return NextResponse.json({ error: `Jumlah maksimal pemesanan adalah ${service.max_order.toLocaleString()}` }, { status: 400 });
    }

    // 5. Recalculate price server-side to prevent price tampering
    const pricePerK = parseFloat(service.price_per_k);
    const totalPrice = Math.round((pricePerK / 1000) * quantity);

    // 6. Fetch user profile balance from DB
    const profileRes = await query('SELECT balance FROM profiles WHERE id = $1', [userId]);
    if (profileRes.rows.length === 0) {
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan' }, { status: 404 });
    }

    const currentBalance = parseFloat(profileRes.rows[0].balance || '0.00');

    if (currentBalance < totalPrice) {
      return NextResponse.json({ error: 'Saldo Anda tidak mencukupi untuk melakukan pemesanan ini' }, { status: 400 });
    }

    let providerOrderId: string | null = null;
    let initialStatus = 'pending';

    // 7. If linked to SMM Provider (BuzzerPanel or MedanPedia), forward the order
    if (service.provider_id && service.provider_id !== 'manual' && service.provider_service_id) {
      let providerRes;
      
      if (service.provider_id === 'medanpedia') {
        providerRes = await placeMedanPediaOrder(
          service.provider_service_id,
          target_url,
          quantity,
          additionalParams || {}
        );
      } else {
        providerRes = await placeProviderOrder(
          service.provider_service_id,
          target_url,
          quantity,
          additionalParams || {}
        );
      }

      if (!providerRes.status) {
        const providerError = providerRes.data?.msg || 'Gagal mengirim pesanan ke provider pusat';
        console.error(`${service.provider_id} placement failed: ${providerError}`);
        
        const errLower = providerError.toLowerCase();
        
        const isAdminError = 
          errLower.includes('saldo') || 
          errLower.includes('balance') || 
          errLower.includes('credit') || 
          errLower.includes('api key') || 
          errLower.includes('secret') || 
          errLower.includes('credential') || 
          errLower.includes('kredensial') ||
          errLower.includes('maintenance') ||
          errLower.includes('tidak tersedia') ||
          errLower.includes('sistem') ||
          errLower.includes('connection') ||
          errLower.includes('timeout') ||
          errLower.includes('internal connection error');

        if (isAdminError) {
          // Save the order to DB as 'pending' (with NULL provider_order_id)
          // The user's balance will be deducted, and the admin can retry it later after top-up
          providerOrderId = null;
          initialStatus = 'pending';
        } else {
          // If it's a client input error, reject immediately so the user can fix it
          return NextResponse.json({ error: `Gagal memproses pesanan: ${providerError}` }, { status: 400 });
        }
      } else {
        providerOrderId = String(providerRes.data?.id || '');
        initialStatus = 'processing'; // Change status to processing as it has been sent to provider
      }
    }

    // 8. Deduct user balance
    const newBalance = currentBalance - totalPrice;
    await query('UPDATE profiles SET balance = $1 WHERE id = $2', [newBalance, userId]);

    // 9. Create Order record in DB
    const orderInsertRes = await query(
      `INSERT INTO orders (user_id, service_id, category, service_name, target_url, quantity, price_per_k, total_price, status, start_count, payment_status, payment_method, provider_order_id, provider_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        userId,
        service.id,
        service.category,
        service.name,
        target_url,
        quantity,
        pricePerK,
        totalPrice,
        initialStatus,
        0,
        'paid',
        'wallet',
        providerOrderId,
        service.provider_id || 'manual'
      ]
    );

    const createdOrder = orderInsertRes.rows[0];

    // 10. Record Transaction Log
    await query(
      `INSERT INTO transactions (user_id, amount, type, status, reference_id, payment_method)
       VALUES ($1, $2, 'order_payment', 'success', $3, 'wallet')`,
      [userId, -totalPrice, createdOrder.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      order: createdOrder,
      newBalance
    });

  } catch (err: any) {
    console.error('Error in create order API:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem internal' }, { status: 500 });
  }
}
