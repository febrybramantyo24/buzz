import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // 1. Fetch transaction from database
    const txCheck = await query('SELECT * FROM transactions WHERE id = $1', [orderId]);
    if (txCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    const tx = txCheck.rows[0];

    // If transaction is already successful, return early
    if (tx.status === 'success') {
      const profile = await query('SELECT balance FROM profiles WHERE id = $1', [tx.user_id]);
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction already processed', 
        status: 'success',
        newBalance: parseFloat(profile.rows[0]?.balance || '0') 
      });
    }

    // 2. Query Midtrans API directly to check actual payment status
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    const midtransOrderId = `T-${tx.id}`;
    const statusUrl = isProduction
      ? `https://api.midtrans.com/v2/${midtransOrderId}/status`
      : `https://api.sandbox.midtrans.com/v2/${midtransOrderId}/status`;

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Midtrans status check failed:', errData);
      return NextResponse.json({ error: 'Failed to verify payment status with Midtrans' }, { status: 500 });
    }

    const data = await response.json();
    const { transaction_status, fraud_status, gross_amount, payment_type } = data;

    // Determine if payment is successful
    let isPaid = false;
    if (transaction_status === 'settlement') {
      isPaid = true;
    } else if (transaction_status === 'capture' && fraud_status !== 'challenge') {
      isPaid = true;
    }

    if (!isPaid) {
      return NextResponse.json({ 
        success: false, 
        message: `Payment status is ${transaction_status}`, 
        status: transaction_status 
      });
    }

    // 3. Process the successful payment securely on the server
    const profileCheck = await query('SELECT balance, username, email FROM profiles WHERE id = $1', [tx.user_id]);
    if (profileCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch dynamic deposit bonus settings
    const settingsRes = await query('SELECT key, value FROM site_settings');
    const siteSettings = settingsRes.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const bonusMinLimit = parseInt(siteSettings.deposit_bonus_min) || 10000;
    const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;

    const baseAmount = Number(gross_amount);
    let creditedAmount = baseAmount;
    
    if (baseAmount >= bonusMinLimit && bonusPercent > 0) {
      creditedAmount = Math.round(baseAmount + (baseAmount * bonusPercent / 100));
    }

    // Update profile balance atomically to prevent race condition
    const updateProfileRes = await query(
      'UPDATE profiles SET balance = balance + $1 WHERE id = $2 RETURNING balance',
      [creditedAmount, tx.user_id]
    );
    const newBalance = parseFloat(updateProfileRes.rows[0]?.balance || '0');

    // Process referral commission if referrer exists and referral system is enabled
    try {
      const referralEnabledRes = await query("SELECT value FROM site_settings WHERE key = 'referral_enabled'");
      const referralCommissionRes = await query("SELECT value FROM site_settings WHERE key = 'referral_commission_percent'");
      
      const refEnabled = referralEnabledRes.rows[0]?.value === 'true';
      const refPercent = parseFloat(referralCommissionRes.rows[0]?.value || '5');

      if (refEnabled && refPercent > 0) {
        // Find if user has a referred_by link
        const profileQuery = await query("SELECT referred_by FROM profiles WHERE id = $1", [tx.user_id]);
        const referrerId = profileQuery.rows[0]?.referred_by;

        if (referrerId) {
          // Calculate commission
          const commissionAmount = Math.round(baseAmount * (refPercent / 100));

          if (commissionAmount > 0) {
            // Get referrer username/email for logging
            const referrerProfile = await query("SELECT username, email FROM profiles WHERE id = $1", [referrerId]);
            if (referrerProfile.rows.length > 0) {
              // 1. Update referrer balance atomically
              await query(
                "UPDATE profiles SET balance = balance + $1 WHERE id = $2",
                [commissionAmount, referrerId]
              );

              // 2. Log in referral_logs
              await query(
                `INSERT INTO referral_logs (referrer_id, referred_id, deposit_id, deposit_amount, commission_amount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [referrerId, tx.user_id, tx.id, baseAmount, commissionAmount]
              );

              // 3. Log in transactions for referrer
              const referralDesc = `Komisi Referral dari deposit user @${profileCheck.rows[0].username || profileCheck.rows[0].email.split('@')[0]} sebesar Rp ${baseAmount.toLocaleString('id-ID')} (Komisi ${refPercent}%)`;
              await query(
                `INSERT INTO transactions (user_id, amount, type, status, description, payment_method)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [referrerId, commissionAmount, 'referral', 'success', referralDesc, 'REFERRAL']
              );
            }
          }
        }
      }
    } catch (refErr) {
      console.error('Error processing referral commission:', refErr);
    }

    // Update transaction status
    await query(
      'UPDATE transactions SET status = $1, payment_method = $2 WHERE id = $3',
      ['success', payment_type || 'midtrans', tx.id]
    );

    // Update transaction description
    const bonusAmount = creditedAmount - baseAmount;
    const txDesc = bonusAmount > 0 
      ? `Top Up Saldo Akun. Deposit: Rp ${baseAmount.toLocaleString('id-ID')} + Bonus ${bonusPercent}% (Rp ${bonusAmount.toLocaleString('id-ID')}) -> Saldo Didapat: Rp ${creditedAmount.toLocaleString('id-ID')}`
      : `Top Up Saldo Akun. Saldo Didapat: Rp ${baseAmount.toLocaleString('id-ID')}`;

    await query(
      'UPDATE transactions SET description = $1 WHERE id = $2',
      [txDesc, tx.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified and balance updated successfully',
      status: 'success',
      newBalance
    });

  } catch (err: any) {
    console.error('Error in payment verification API:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
