import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getProviderOrderStatus } from '@/lib/buzzerpanel';
import { getMedanPediaOrderStatus } from '@/lib/medanpedia';

export async function GET(request: Request) {
  try {
    // 0. Automatically expire pending topup transactions older than 24 hours (set status to failed)
    const expireRes = await query(
      `UPDATE transactions 
       SET status = 'failed' 
       WHERE type = 'topup' 
         AND status = 'pending' 
         AND created_at < NOW() - INTERVAL '2 hours'`
    );
    if (expireRes.rowCount && expireRes.rowCount > 0) {
      console.log(`Expired ${expireRes.rowCount} pending topup transactions (2 hours limit reached).`);
    }

    // 1. Fetch active orders connected to any SMM provider
    const activeOrdersRes = await query(
      `SELECT o.*, s.provider_id FROM orders o
       LEFT JOIN services s ON o.service_id = s.id
       WHERE o.status IN ('pending', 'processing', 'inprogress') 
         AND o.provider_order_id IS NOT NULL 
         AND o.provider_order_id != ''`
    );

    const activeOrders = activeOrdersRes.rows;
    const results = [];

    // 2. Loop through and sync each order
    for (const order of activeOrders) {
      try {
        let providerRes;
        
        if (order.provider_id === 'medanpedia') {
          providerRes = await getMedanPediaOrderStatus(order.provider_order_id);
        } else {
          providerRes = await getProviderOrderStatus(order.provider_order_id);
        }

        if (!providerRes.status) {
          console.warn(`Could not sync order ${order.id} with provider ID ${order.provider_order_id}: ${providerRes.data?.msg}`);
          continue;
        }

        const providerData = providerRes.data;
        // Provider status can be: 'Pending', 'Processing', 'In progress', 'Completed', 'Success', 'Failed', 'Canceled', 'Partial'
        const providerStatus = String(providerData.status || '').toLowerCase();
        const startCount = providerData.start_count !== undefined ? parseInt(providerData.start_count, 10) : order.start_count;
        const remains = providerData.remains !== undefined ? parseInt(providerData.remains, 10) : 0;

        let localStatus = order.status;
        let shouldRefund = false;
        let refundAmount = 0;
        let refundReason = '';

        if (providerStatus === 'success' || providerStatus === 'completed') {
          localStatus = 'success';
        } else if (providerStatus === 'processing') {
          localStatus = 'processing';
        } else if (providerStatus === 'in progress' || providerStatus === 'inprogress') {
          localStatus = 'inprogress';
        } else if (providerStatus === 'pending') {
          localStatus = 'pending';
        } else if (providerStatus === 'failed' || providerStatus === 'canceled') {
          localStatus = 'failed';
          shouldRefund = true;
          refundAmount = parseFloat(order.total_price);
          refundReason = 'failed/canceled by provider';
        } else if (providerStatus === 'partial') {
          localStatus = 'failed'; // Mark as failed/partial
          shouldRefund = true;
          
          // Calculate partial refund: (remains / quantity) * total_price
          const quantity = parseInt(order.quantity, 10) || 1;
          const totalPaid = parseFloat(order.total_price);
          if (remains > 0 && remains < quantity) {
            refundAmount = Math.round((remains / quantity) * totalPaid);
          } else {
            refundAmount = totalPaid; // Default to full if remains is invalid/same as quantity
          }
          refundReason = 'partial delivery by provider';
        }

        // If status changed or needs a refund, update database
        if (localStatus !== order.status || shouldRefund) {
          // Process refund if applicable
          if (shouldRefund && refundAmount > 0 && order.user_id) {
            // Cap refund amount to avoid credit exploitation
            const cappedRefund = Math.min(refundAmount, parseFloat(order.total_price));

            // 1. Credit user balance
            await query(
              'UPDATE profiles SET balance = balance + $1 WHERE id = $2',
              [cappedRefund, order.user_id]
            );

            // 2. Record transaction log
            await query(
              `INSERT INTO transactions (user_id, amount, type, status, reference_id, payment_method)
               VALUES ($1, $2, 'refund', 'success', $3, 'wallet')`,
              [order.user_id, cappedRefund, order.id]
            );

            // 3. Update order in database with refunded payment status
            await query(
              `UPDATE orders 
               SET status = $1, start_count = $2, payment_status = 'refunded' 
               WHERE id = $3`,
              [localStatus, startCount, order.id]
            );

            console.log(`Refunded Rp ${cappedRefund} to user ${order.user_id} for order ${order.id} (${refundReason})`);
          } else {
            // Just update order status
            await query(
              `UPDATE orders 
               SET status = $1, start_count = $2 
               WHERE id = $3`,
              [localStatus, startCount, order.id]
            );
          }

          results.push({
            orderId: order.id,
            providerOrderId: order.provider_order_id,
            oldStatus: order.status,
            newStatus: localStatus,
            startCount,
            refunded: shouldRefund,
            refundAmount
          });
        }
      } catch (orderErr: any) {
        console.error(`Error syncing status for order ${order.id}:`, orderErr);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: results.length,
      syncedOrders: results
    });

  } catch (err: any) {
    console.error('Error in cron sync-status route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
