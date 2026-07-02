import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
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

    // 1. Fetch statistics
    // Filter out manual and wallet payments, keeping Midtrans-initiated top-ups
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as success_volume,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_volume,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END), 0) as failed_volume,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(*) as total_count
      FROM transactions 
      WHERE type = 'topup' 
        AND payment_method != 'manual' 
        AND payment_method != 'wallet'
    `);

    // Today's statistics
    const statsTodayRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as volume,
        COUNT(*) as count
      FROM transactions 
      WHERE type = 'topup' 
        AND status = 'success'
        AND payment_method != 'manual' 
        AND payment_method != 'wallet'
        AND created_at >= NOW() - INTERVAL '1 day'
    `);

    // This month's statistics
    const statsMonthRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as volume,
        COUNT(*) as count
      FROM transactions 
      WHERE type = 'topup' 
        AND status = 'success'
        AND payment_method != 'manual' 
        AND payment_method != 'wallet'
        AND created_at >= DATE_TRUNC('month', NOW())
    `);

    // 2. Fetch list of transactions
    const txRes = await query(`
      SELECT 
        t.*, 
        p.username, 
        p.email 
      FROM transactions t 
      LEFT JOIN profiles p ON t.user_id = p.id 
      WHERE t.type = 'topup' 
        AND t.payment_method != 'manual' 
        AND t.payment_method != 'wallet'
      ORDER BY t.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalVolume: parseFloat(statsRes.rows[0].success_volume),
        pendingVolume: parseFloat(statsRes.rows[0].pending_volume),
        failedVolume: parseFloat(statsRes.rows[0].failed_volume),
        successCount: parseInt(statsRes.rows[0].success_count),
        pendingCount: parseInt(statsRes.rows[0].pending_count),
        failedCount: parseInt(statsRes.rows[0].failed_count),
        totalCount: parseInt(statsRes.rows[0].total_count),
        todayVolume: parseFloat(statsTodayRes.rows[0].volume),
        todayCount: parseInt(statsTodayRes.rows[0].count),
        monthVolume: parseFloat(statsMonthRes.rows[0].volume),
        monthCount: parseInt(statsMonthRes.rows[0].count),
      },
      transactions: txRes.rows
    });

  } catch (err: any) {
    console.error('Error fetching Midtrans reporting data:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST endpoint for batch syncing pending transactions
export async function POST(request: Request) {
  try {
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

    // Find all pending midtrans transactions
    const pendingTxs = await query(`
      SELECT * FROM transactions 
      WHERE type = 'topup' 
        AND status = 'pending' 
        AND payment_method != 'manual' 
        AND payment_method != 'wallet'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const authHeaderMidtrans = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    const results = [];
    const settingsRes = await query('SELECT key, value FROM site_settings');
    const siteSettings = settingsRes.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const bonusMinLimit = parseInt(siteSettings.deposit_bonus_min) || 10000;
    const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;

    for (const tx of pendingTxs.rows) {
      const midtransOrderId = `T-${tx.id}`;
      const statusUrl = isProduction
        ? `https://api.midtrans.com/v2/${midtransOrderId}/status`
        : `https://api.sandbox.midtrans.com/v2/${midtransOrderId}/status`;

      try {
        const response = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authHeaderMidtrans,
          },
        });

        if (!response.ok) {
          results.push({ id: tx.id, orderId: midtransOrderId, status: 'api_error' });
          continue;
        }

        const data = await response.json();
        const { transaction_status, fraud_status, gross_amount, payment_type } = data;

        let isPaid = false;
        if (transaction_status === 'settlement') {
          isPaid = true;
        } else if (transaction_status === 'capture' && fraud_status !== 'challenge') {
          isPaid = true;
        }

        if (isPaid) {
          // Process balance crediting
          const userRes = await query('SELECT balance FROM profiles WHERE id = $1', [tx.user_id]);
          if (userRes.rows.length > 0) {
            const baseAmount = Number(gross_amount);
            let creditedAmount = baseAmount;
            
            if (baseAmount >= bonusMinLimit && bonusPercent > 0) {
              creditedAmount = Math.round(baseAmount + (baseAmount * bonusPercent / 100));
            }

            const currentBalance = Number(userRes.rows[0].balance || 0);
            const newBalance = currentBalance + creditedAmount;

            // Update balance
            await query('UPDATE profiles SET balance = $1 WHERE id = $2', [newBalance, tx.user_id]);

            // Update transaction
            const bonusAmount = creditedAmount - baseAmount;
            const txDesc = bonusAmount > 0 
              ? `Top Up Saldo Akun. Deposit: Rp ${baseAmount.toLocaleString('id-ID')} + Bonus ${bonusPercent}% (Rp ${bonusAmount.toLocaleString('id-ID')}) -> Saldo Didapat: Rp ${creditedAmount.toLocaleString('id-ID')}`
              : `Top Up Saldo Akun. Saldo Didapat: Rp ${baseAmount.toLocaleString('id-ID')}`;

            await query(
              `UPDATE transactions 
               SET status = 'success', payment_method = $1, description = $2 
               WHERE id = $3`,
              [payment_type || 'midtrans', txDesc, tx.id]
            );

            results.push({ id: tx.id, orderId: midtransOrderId, status: 'success', updated: true });
          } else {
            results.push({ id: tx.id, orderId: midtransOrderId, status: 'user_not_found' });
          }
        } else if (transaction_status === 'expire' || transaction_status === 'cancel' || transaction_status === 'deny') {
          await query("UPDATE transactions SET status = 'failed' WHERE id = $1", [tx.id]);
          results.push({ id: tx.id, orderId: midtransOrderId, status: 'failed', updated: true });
        } else {
          results.push({ id: tx.id, orderId: midtransOrderId, status: transaction_status, updated: false });
        }
      } catch (err) {
        console.error(`Error syncing transaction ${tx.id}:`, err);
        results.push({ id: tx.id, orderId: midtransOrderId, status: 'exception' });
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: results.filter(r => r.updated).length,
      details: results
    });

  } catch (err: any) {
    console.error('Error syncing Midtrans transactions:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
