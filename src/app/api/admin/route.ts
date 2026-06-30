import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { placeProviderOrder } from '@/lib/buzzerpanel';
import { placeMedanPediaOrder } from '@/lib/medanpedia';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    // Verify token using JWT Secret
    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify if user is admin in profiles table
    const profileRes = await query(
      "SELECT role FROM profiles WHERE id = $1", 
      [decoded.userId]
    );

    if (profileRes.rows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized: Profile not found' }, { status: 401 });
    }

    const isAdmin = profileRes.rows[0].role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Self-healing schema migration
    try {
      await query("ALTER TABLE services ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;");
      await query("ALTER TABLE services ADD COLUMN IF NOT EXISTS average_duration VARCHAR(255) DEFAULT '15 Menit';");
      await query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;");
      await query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;");
      await query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;");
    } catch (e) {
      console.error('Migration failed:', e);
    }

    // Fetch all profiles
    const profilesRes = await query("SELECT * FROM profiles ORDER BY created_at DESC");
    const profilesList = profilesRes.rows;

    // Fetch all orders
    const ordersRes = await query("SELECT * FROM orders ORDER BY created_at DESC");
    const ordersData = ordersRes.rows;

    // Fetch all transactions
    const transactionsRes = await query("SELECT * FROM transactions ORDER BY created_at DESC");
    const transactionsData = transactionsRes.rows;

    // Join profiles manually in JS
    const orders = ordersData.map(order => {
      const prof = profilesList.find(p => p.id === order.user_id);
      return {
        ...order,
        profiles: prof ? { email: prof.email } : null
      };
    });

    const transactions = transactionsData.map(tx => {
      const prof = profilesList.find(p => p.id === tx.user_id);
      return {
        ...tx,
        profiles: prof ? { email: prof.email } : null
      };
    });

    return NextResponse.json({
      orders: orders,
      transactions: transactions,
      profiles: profilesList
    });

  } catch (err: any) {
    console.error('Error in Admin API route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    // Verify token using JWT Secret
    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Verify if user is admin in profiles table
    const profileRes = await query(
      "SELECT role FROM profiles WHERE id = $1", 
      [decoded.userId]
    );

    if (profileRes.rows.length === 0 || profileRes.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId, status, startCount, refundAmount, targetUserId, adjustmentType, amount, reason } = body;

    if (action === 'process_refund') {
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      // Get the current order details
      const orderQuery = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderQuery.rows.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const order = orderQuery.rows[0];

      if (order.payment_status === 'refunded') {
        return NextResponse.json({ error: 'Order ini sudah direfund sebelumnya' }, { status: 400 });
      }

      // Decide refund amount: can accept manual refundAmount from request, or fallback to order.provider_refund_amount, or order.total_price
      let actualRefund = refundAmount !== undefined ? parseFloat(refundAmount) : parseFloat(order.provider_refund_amount || 0);
      if (actualRefund <= 0) {
        actualRefund = parseFloat(order.total_price);
      }

      const maxRefundable = parseFloat(order.total_price);
      if (actualRefund > maxRefundable) {
        actualRefund = maxRefundable;
      }

      if (actualRefund > 0 && order.user_id) {
        // Fetch current user balance
        const userRes = await query('SELECT balance FROM profiles WHERE id = $1', [order.user_id]);
        const startBalance = userRes.rows[0] ? parseFloat(userRes.rows[0].balance) : 0;
        const endBalance = startBalance + actualRefund;

        // Update user profile balance
        await query(
          'UPDATE profiles SET balance = balance + $1 WHERE id = $2',
          [actualRefund, order.user_id]
        );

        // Record a transaction log of type 'refund'
        const refundNote = `Refund disetujui Admin untuk order #${order.order_id || order.id.slice(0, 8)}. Saldo awal: Rp ${startBalance.toLocaleString('id-ID')} -> Saldo akhir: Rp ${endBalance.toLocaleString('id-ID')}`;

        await query(
          `INSERT INTO transactions (user_id, amount, type, status, payment_method, reference_id, description) 
           VALUES ($1, $2, 'refund', 'success', 'wallet', $3, $4)`,
          [order.user_id, actualRefund, orderId, refundNote]
        );

        // Update order status to failed and payment_status to refunded
        await query(
          `UPDATE orders 
           SET payment_status = 'refunded', status = 'failed', provider_refund_amount = $1 
           WHERE id = $2`,
          [actualRefund, orderId]
        );
      }

      return NextResponse.json({ success: true, message: 'Refund berhasil diproses oleh Admin' });
    }

    if (action === 'update_user_balance') {
      if (!targetUserId || !adjustmentType || amount === undefined) {
        return NextResponse.json({ error: 'Data tidak lengkap untuk penyesuaian saldo' }, { status: 400 });
      }

      const nominal = parseFloat(amount);
      if (isNaN(nominal) || nominal < 0) {
        return NextResponse.json({ error: 'Nominal saldo tidak valid' }, { status: 400 });
      }

      // Check if target user profile exists
      const userRes = await query('SELECT balance, email FROM profiles WHERE id = $1', [targetUserId]);
      if (userRes.rows.length === 0) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      const startBalance = parseFloat(userRes.rows[0].balance || '0');
      let endBalance = startBalance;

      if (adjustmentType === 'add') {
        endBalance = startBalance + nominal;
      } else if (adjustmentType === 'subtract') {
        endBalance = startBalance - nominal;
        if (endBalance < 0) {
          return NextResponse.json({ error: 'Saldo akhir tidak boleh negatif' }, { status: 400 });
        }
      } else if (adjustmentType === 'set') {
        endBalance = nominal;
      } else {
        return NextResponse.json({ error: 'Tipe penyesuaian saldo tidak dikenal' }, { status: 400 });
      }

      const diff = endBalance - startBalance;
      if (diff === 0) {
        return NextResponse.json({ error: 'Tidak ada perubahan nominal saldo' }, { status: 400 });
      }

      // Update user balance
      await query('UPDATE profiles SET balance = $1 WHERE id = $2', [endBalance, targetUserId]);

      // Record transaction log
      const formattedDiff = Math.abs(diff).toLocaleString('id-ID');
      const actionSymbol = diff > 0 ? '+' : '-';
      const defaultReason = diff > 0 ? 'Topup manual oleh Admin' : 'Penyesuaian saldo (dikurangi) oleh Admin';
      const logNote = `${reason || defaultReason}. Penyesuaian: ${actionSymbol}Rp ${formattedDiff}. Saldo awal: Rp ${startBalance.toLocaleString('id-ID')} -> Saldo akhir: Rp ${endBalance.toLocaleString('id-ID')}`;
      
      const txType = diff >= 0 ? 'topup' : 'order_payment';

      await query(
        `INSERT INTO transactions (user_id, amount, type, status, payment_method, reference_id, description) 
         VALUES ($1, $2, $3, 'success', 'manual', $4, $5)`,
        [targetUserId, Math.abs(diff), txType, `manual-${Date.now()}`, logNote]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Saldo user berhasil diperbarui', 
        oldBalance: startBalance, 
        newBalance: endBalance 
      });
    }

    if (action === 'retry_provider') {
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      // Get current order details
      const orderQuery = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderQuery.rows.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const order = orderQuery.rows[0];

      // Fetch service details from DB
      const serviceRes = await query(
        'SELECT provider_id, provider_service_id FROM services WHERE id = $1',
        [order.service_id]
      );

      if (serviceRes.rows.length === 0) {
        return NextResponse.json({ error: 'Layanan terkait tidak ditemukan' }, { status: 404 });
      }

      const service = serviceRes.rows[0];

      if (!service.provider_id || service.provider_id === 'manual' || !service.provider_service_id) {
        return NextResponse.json({ error: 'Layanan ini tidak dihubungkan ke provider otomatis' }, { status: 400 });
      }

      let providerRes;
      if (service.provider_id === 'medanpedia') {
        providerRes = await placeMedanPediaOrder(
          service.provider_service_id,
          order.target_url,
          order.quantity,
          {}
        );
      } else {
        providerRes = await placeProviderOrder(
          service.provider_service_id,
          order.target_url,
          order.quantity,
          {}
        );
      }

      if (!providerRes.status) {
        const providerError = providerRes.data?.msg || 'Gagal mengirim pesanan ke provider pusat';
        return NextResponse.json({ error: `Gagal dari provider: ${providerError}` }, { status: 400 });
      }

      const providerOrderId = String(providerRes.data?.id || '');

      // Update order status to processing and set provider_order_id
      await query(
        'UPDATE orders SET status = $1, provider_order_id = $2 WHERE id = $3',
        ['processing', providerOrderId, orderId]
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Berhasil mengirim ulang ke provider pusat', 
        provider_order_id: providerOrderId 
      });
    }

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    // Get the current order details
    const orderQuery = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderQuery.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orderQuery.rows[0];
    const prevStatus = order.status;

    // Update order status
    const isRefundedStatus = status === 'failed' || status === 'partial';
    await query(
      'UPDATE orders SET status = $1, start_count = $2, payment_status = $3 WHERE id = $4',
      [status, startCount || 0, isRefundedStatus ? 'refunded' : 'paid', orderId]
    );

    // If status is changed to failed or partial, and order wasn't refunded before, process refund
    if (isRefundedStatus && order.payment_status !== 'refunded' && order.user_id) {
      let actualRefund = 0;
      if (status === 'failed') {
        actualRefund = refundAmount !== undefined ? parseFloat(refundAmount) : parseFloat(order.total_price);
      } else if (status === 'partial') {
        actualRefund = refundAmount !== undefined ? parseFloat(refundAmount) : 0;
      }
      
      const maxRefundable = parseFloat(order.total_price);
      if (actualRefund > maxRefundable) {
        actualRefund = maxRefundable;
      }

      if (actualRefund > 0) {
        // Fetch current user balance
        const userRes = await query('SELECT balance FROM profiles WHERE id = $1', [order.user_id]);
        const startBalance = userRes.rows[0] ? parseFloat(userRes.rows[0].balance) : 0;
        const endBalance = startBalance + actualRefund;

        // Update user profile balance
        await query(
          'UPDATE profiles SET balance = balance + $1 WHERE id = $2',
          [actualRefund, order.user_id]
        );

        // Record a transaction log of type 'refund' with detailed description showing old and new balance
        const refundNote = status === 'failed'
          ? `Refund penuh untuk order #${orderId.slice(0, 8)} (Gagal). Saldo awal: Rp ${startBalance.toLocaleString('id-ID')} -> Saldo akhir: Rp ${endBalance.toLocaleString('id-ID')}`
          : `Refund sebagian (Partial) untuk order #${orderId.slice(0, 8)}. Saldo awal: Rp ${startBalance.toLocaleString('id-ID')} -> Saldo akhir: Rp ${endBalance.toLocaleString('id-ID')}`;

        await query(
          `INSERT INTO transactions (user_id, amount, type, status, payment_method, reference_id, description) 
           VALUES ($1, $2, 'refund', 'success', 'wallet', $3, $4)`,
          [order.user_id, actualRefund, orderId, refundNote]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Order status updated successfully' });

  } catch (err: any) {
    console.error('Error in Admin POST API route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
