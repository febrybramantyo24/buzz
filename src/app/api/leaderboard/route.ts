import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    // Build date filters with proper table aliases to avoid ambiguity
    let orderDateFilter: string;
    let transactionDateFilter: string;
    if (period === 'last') {
      orderDateFilter = `o.created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND o.created_at < date_trunc('month', NOW())`;
      transactionDateFilter = `t.created_at >= date_trunc('month', NOW() - INTERVAL '1 month') AND t.created_at < date_trunc('month', NOW())`;
    } else {
      orderDateFilter = `o.created_at >= date_trunc('month', NOW())`;
      transactionDateFilter = `t.created_at >= date_trunc('month', NOW())`;
    }

    // Top 10 Pemesanan (by total spending)
    const topOrdersQuery = await query(`
      SELECT p.full_name, p.username, 
             SUM(o.total_price) as total_spent, 
             COUNT(*) as total_orders
      FROM orders o
      JOIN profiles p ON o.user_id = p.id
      WHERE o.status = 'success'
        AND ${orderDateFilter}
      GROUP BY p.id, p.full_name, p.username
      ORDER BY total_spent DESC 
      LIMIT 10
    `);

    // Top 10 Deposit (by total deposit amount)
    const topDepositsQuery = await query(`
      SELECT p.full_name, p.username, 
             SUM(t.amount) as total_deposit
      FROM transactions t
      JOIN profiles p ON t.user_id = p.id
      WHERE t.type = 'topup' 
        AND t.status = 'success' 
        AND ${transactionDateFilter}
      GROUP BY p.id, p.full_name, p.username
      ORDER BY total_deposit DESC 
      LIMIT 10
    `);

    // Top 10 Layanan Terlaris (by order count)
    const topServicesCountQuery = await query(`
      SELECT o.service_name, o.service_id,
             COUNT(*) as total_orders,
             SUM(o.quantity) as total_quantity
      FROM orders o
      WHERE o.payment_status IN ('paid', 'refunded') 
        AND ${orderDateFilter}
      GROUP BY o.service_name, o.service_id
      ORDER BY total_orders DESC 
      LIMIT 10
    `);

    // Top 10 Layanan Penjualan Tertinggi (by total revenue)
    const topServicesRevenueQuery = await query(`
      SELECT o.service_name, o.service_id,
             SUM(o.total_price) as total_revenue,
             COUNT(*) as total_orders
      FROM orders o
      WHERE o.payment_status IN ('paid', 'refunded') 
        AND ${orderDateFilter}
      GROUP BY o.service_name, o.service_id
      ORDER BY total_revenue DESC 
      LIMIT 10
    `);

    return NextResponse.json({
      topOrders: topOrdersQuery.rows.map((r: any) => ({
        name: r.full_name || r.username || 'Anonim',
        totalSpent: parseFloat(r.total_spent),
        totalOrders: parseInt(r.total_orders),
      })),
      topDeposits: topDepositsQuery.rows.map((r: any) => ({
        name: r.full_name || r.username || 'Anonim',
        totalDeposit: parseFloat(r.total_deposit),
      })),
      topServicesCount: topServicesCountQuery.rows.map((r: any) => ({
        name: r.service_name || 'Layanan Dihapus',
        serviceId: r.service_id,
        totalOrders: parseInt(r.total_orders),
        totalQuantity: parseInt(r.total_quantity || 0),
      })),
      topServicesRevenue: topServicesRevenueQuery.rows.map((r: any) => ({
        name: r.service_name || 'Layanan Dihapus',
        serviceId: r.service_id,
        totalRevenue: parseFloat(r.total_revenue),
        totalOrders: parseInt(r.total_orders),
      })),
      period,
    });
  } catch (err: any) {
    console.error('Error in Leaderboard API:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
