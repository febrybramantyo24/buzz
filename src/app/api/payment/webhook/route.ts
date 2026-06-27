import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const notification = await request.json();
    console.log('Received Midtrans webhook:', notification);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type
    } = notification;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Missing required payload keys' }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    // Verify webhook signature to prevent spoofing
    const signatureSource = order_id + status_code + gross_amount + serverKey;
    const computedSignature = crypto
      .createHash('sha512')
      .update(signatureSource)
      .digest('hex');

    if (computedSignature !== signature_key) {
      console.warn('Invalid Midtrans signature matching attempt');
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 403 });
    }

    // Determine status mappings
    let paymentStatus: 'paid' | 'unpaid' | 'expired' = 'unpaid';
    let orderStatus: 'pending' | 'failed' | null = null;

    if (transaction_status === 'settlement') {
      paymentStatus = 'paid';
      orderStatus = 'pending';
    } else if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'unpaid';
      } else if (fraud_status === 'accept') {
        paymentStatus = 'paid';
        orderStatus = 'pending';
      }
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'expired';
      orderStatus = 'failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'unpaid';
    }

    // Check if this is a wallet topup transaction
    const isTopup = order_id.startsWith('T-');

    if (isTopup) {
      // Format: T-[transactionId]
      const actualTxId = order_id.substring(2);

      const statusVal = paymentStatus === 'paid' ? 'success' : (paymentStatus === 'expired' ? 'failed' : 'pending');

      // Fetch transaction first to prevent duplicate crediting
      const txCheck = await query('SELECT * FROM transactions WHERE id = $1', [actualTxId]);

      if (txCheck.rows.length === 0) {
        console.warn('Topup transaction not found in DB:', actualTxId);
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      const tx = txCheck.rows[0];

      // Update transaction status
      await query(
        'UPDATE transactions SET status = $1, payment_method = $2 WHERE id = $3',
        [statusVal, payment_type || 'midtrans', actualTxId]
      );

      // If transition to success and was not already success, update user balance
      if (statusVal === 'success' && tx.status !== 'success') {
        const profileCheck = await query('SELECT balance FROM profiles WHERE id = $1', [tx.user_id]);

        if (profileCheck.rows.length === 0) {
          console.error('Failed to fetch user profile for balance update');
        } else {
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

          const currentBalance = Number(profileCheck.rows[0].balance || 0);
          const newBalance = currentBalance + creditedAmount;

          // Update profile balance
          await query('UPDATE profiles SET balance = $1 WHERE id = $2', [newBalance, tx.user_id]);

          // Keep transactions.amount as the baseAmount (gross_amount) paid by the user.
          // Update transaction description to show the deposit breakdown (Base + Bonus).
          const bonusAmount = creditedAmount - baseAmount;
          const txDesc = bonusAmount > 0 
            ? `Top Up Saldo Akun. Deposit: Rp ${baseAmount.toLocaleString('id-ID')} + Bonus ${bonusPercent}% (Rp ${bonusAmount.toLocaleString('id-ID')}) -> Saldo Didapat: Rp ${creditedAmount.toLocaleString('id-ID')}`
            : `Top Up Saldo Akun. Saldo Didapat: Rp ${baseAmount.toLocaleString('id-ID')}`;

          await query(
            'UPDATE transactions SET description = $1 WHERE id = $2',
            [txDesc, actualTxId]
          );
        }
      }

      return NextResponse.json({ success: true, message: 'Topup transaction notification processed' });
    }

    // Regular order payment
    // Format: O-[orderId]
    const actualOrderId = order_id.substring(2);

    // Check if order exists
    const orderCheck = await query('SELECT id FROM orders WHERE id = $1', [actualOrderId]);
    if (orderCheck.rows.length === 0) {
      console.warn('Order not found in DB:', actualOrderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order payment status and progress status
    if (orderStatus) {
      await query(
        'UPDATE orders SET payment_status = $1, payment_method = $2, status = $3 WHERE id = $4',
        [paymentStatus, payment_type || 'midtrans', orderStatus, actualOrderId]
      );
    } else {
      await query(
        'UPDATE orders SET payment_status = $1, payment_method = $2 WHERE id = $3',
        [paymentStatus, payment_type || 'midtrans', actualOrderId]
      );
    }

    console.log('Order status updated successfully via Midtrans webhook:', actualOrderId);
    return NextResponse.json({ success: true, message: 'Notification processed' });

  } catch (err: any) {
    console.error('Error handling Midtrans webhook:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
