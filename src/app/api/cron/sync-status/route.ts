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
          if (shouldRefund && refundAmount > 0 && order.user_id) {
            // Cap refund amount to avoid credit exploitation
            const cappedRefund = Math.min(refundAmount, parseFloat(order.total_price));

            // Instead of auto-refunding, set payment_status to 'pending_refund'
            // and save provider details so admin can review and execute it
            await query(
              `UPDATE orders 
               SET status = $1, start_count = $2, payment_status = 'pending_refund', provider_refund_amount = $3, provider_id = $4 
               WHERE id = $5`,
              [localStatus, startCount, cappedRefund, order.provider_id || 'manual', order.id]
            );

            console.log(`Order ${order.id} marked as pending_refund with amount Rp ${cappedRefund} (${refundReason})`);
            
            results.push({
              orderId: order.id,
              providerOrderId: order.provider_order_id,
              oldStatus: order.status,
              newStatus: localStatus,
              startCount,
              refunded: false, // Set to false because it's pending admin review
              refundAmount: cappedRefund,
              paymentStatus: 'pending_refund'
            });
          } else {
            // Just update order status and provider_id
            await query(
              `UPDATE orders 
               SET status = $1, start_count = $2, provider_id = $3 
               WHERE id = $4`,
              [localStatus, startCount, order.provider_id || 'manual', order.id]
            );

            results.push({
              orderId: order.id,
              providerOrderId: order.provider_order_id,
              oldStatus: order.status,
              newStatus: localStatus,
              startCount,
              refunded: false,
              refundAmount: 0
            });
          }
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
