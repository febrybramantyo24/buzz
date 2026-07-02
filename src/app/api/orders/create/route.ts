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

    // Start Database Transaction to reserve balance & record initial 'pending' order
    await query('BEGIN');
    let createdOrder;
    let newBalance;
    try {
      // 1. Deduct user balance atomically
      const deductRes = await query(
        'UPDATE profiles SET balance = balance - $1 WHERE id = $2 RETURNING balance',
        [totalPrice, userId]
      );
      newBalance = parseFloat(deductRes.rows[0]?.balance || '0');

      // 2. Insert initial Order record as 'pending'
      const orderInsertRes = await query(
        `INSERT INTO orders (user_id, service_id, category, service_name, target_url, quantity, price_per_k, total_price, status, start_count, payment_status, payment_method, provider_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 0, 'paid', 'wallet', $9)
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
          service.provider_id || 'manual'
        ]
      );
      createdOrder = orderInsertRes.rows[0];

      // 3. Record Transaction Log
      await query(
        `INSERT INTO transactions (user_id, amount, type, status, reference_id, payment_method)
         VALUES ($1, $2, 'order_payment', 'success', $3, 'wallet')`,
        [userId, -totalPrice, createdOrder.id]
      );

      // Commit transaction
      await query('COMMIT');
    } catch (transactionError) {
      await query('ROLLBACK');
      console.error('Initial DB reservation transaction failed:', transactionError);
      return NextResponse.json({ error: 'Gagal memproses transaksi database lokal' }, { status: 500 });
    }

    // 4. Now, if linked to SMM Provider, forward the order
    if (service.provider_id && service.provider_id !== 'manual' && service.provider_service_id) {
      let providerRes;
      try {
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
      } catch (networkErr: any) {
        // If API call throws (network timeout/crash), treat as connection/admin error. Keep as pending.
        console.error('SMM Provider connection exception:', networkErr);
        providerRes = { status: false, data: { msg: 'timeout/connection error' } };
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
          // Keep the order as 'pending' with NULL provider_order_id. User's balance remains deducted.
          // Admin can retry this manually later.
        } else {
          // Client input error -> Refund the user automatically & set status to failed
          await query('BEGIN');
          try {
            // Refund balance
            await query(
              'UPDATE profiles SET balance = balance + $1 WHERE id = $2',
              [totalPrice, userId]
            );
            // Update order status to failed
            await query(
              "UPDATE orders SET status = 'failed' WHERE id = $1",
              [createdOrder.id]
            );
            // Record refund transaction log
            await query(
              `INSERT INTO transactions (user_id, amount, type, status, reference_id, description, payment_method)
               VALUES ($1, $2, 'refund', 'success', $3, $4, 'wallet')`,
              [userId, totalPrice, createdOrder.id, `Pengembalian dana pemesanan gagal: ${providerError}`, 'wallet']
            );
            await query('COMMIT');
          } catch (refundErr) {
            await query('ROLLBACK');
            console.error('Auto-refund transaction failed:', refundErr);
          }
          return NextResponse.json({ error: `Gagal memproses pesanan: ${providerError}` }, { status: 400 });
        }
      } else {
        // Success: update status to processing and store provider order IDs
        const providerOrderId = String(providerRes.data?.id || '');
        const numericProviderOrderId = parseInt(providerOrderId, 10);

        try {
          if (!isNaN(numericProviderOrderId)) {
            // Update status, provider_order_id, and match local order_id with provider ID
            const updateRes = await query(
              'UPDATE orders SET status = $1, provider_order_id = $2, order_id = $3 WHERE id = $4 RETURNING *',
              ['processing', providerOrderId, numericProviderOrderId, createdOrder.id]
            );
            if (updateRes.rows.length > 0) {
              createdOrder = updateRes.rows[0];
            }
          } else {
            const updateRes = await query(
              'UPDATE orders SET status = $1, provider_order_id = $2 WHERE id = $3 RETURNING *',
              ['processing', providerOrderId, createdOrder.id]
            );
            if (updateRes.rows.length > 0) {
              createdOrder = updateRes.rows[0];
            }
          }
        } catch (dbUpdateErr) {
          // Even if updating provider ID fails in DB, SMM provider accepted the order.
          // Don't refund the user, as the order is running at the provider. Let the admin handle.
          console.error('Failed to update provider ID in DB:', dbUpdateErr);
        }
      }
    }

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
