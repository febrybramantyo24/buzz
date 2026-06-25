import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { orderId, grossAmount, email, type, userId } = await request.json();

    if (!orderId || !grossAmount) {
      return NextResponse.json(
        { error: 'Missing orderId or grossAmount' },
        { status: 400 }
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    
    // Determine Midtrans API URL
    const midtransUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Encode Server Key to Base64 for Basic Auth
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    // Create pending transaction in DB from server-side
    let dbTxId = orderId;
    if (type === 'topup' && userId) {
      // Check if orderId is a valid UUID before searching
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
      
      let existingTx = null;
      if (isUuid) {
        const checkRes = await query('SELECT id FROM transactions WHERE id = $1', [orderId]);
        if (checkRes.rows.length > 0) {
          existingTx = checkRes.rows[0];
        }
      }

      if (!existingTx) {
        try {
          const insertRes = await query(
            `INSERT INTO transactions (user_id, amount, type, status, payment_method) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [userId, grossAmount, 'topup', 'pending', 'midtrans']
          );
          if (insertRes.rows.length > 0) {
            dbTxId = insertRes.rows[0].id;
          }
        } catch (txError) {
          console.error('Failed to create pending transaction in DB:', txError);
        }
      }
    }

    const uniqueOrderId = type === 'topup' 
      ? `TOPUP-${dbTxId}-${Date.now()}` 
      : `${orderId}-${Date.now()}`;

    const payload = {
      transaction_details: {
        order_id: uniqueOrderId,
        gross_amount: Math.round(grossAmount),
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        email: email || 'customer@buzzify.com',
      },
    };

    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Midtrans API error:', data);
      return NextResponse.json(
        { error: data.error_messages ? data.error_messages.join(', ') : 'Midtrans payment request failed' },
        { status: response.status }
      );
    }

    // Returns { token, redirect_url, dbTxId }
    return NextResponse.json({
      token: data.token,
      redirectUrl: data.redirect_url,
      dbTxId: dbTxId
    });

  } catch (err: any) {
    console.error('Error generating Midtrans token:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
