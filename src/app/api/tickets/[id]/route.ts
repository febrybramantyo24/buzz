import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';

async function authenticate(request: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  if (!token) {
    const authHeader = request.headers.get('Authorization') || '';
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    // Check user profile and role
    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    // Fetch ticket details
    const ticketRes = await query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketRes.rows[0];

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan.' }, { status: 404 });
    }

    // Verify ownership (Users can only view their own tickets, Admins can view any)
    if (userRole !== 'admin' && ticket.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Fetch all ticket messages, joined with sender username
    const messagesRes = await query(`
      SELECT m.*, p.username, p.full_name 
      FROM ticket_messages m
      LEFT JOIN profiles p ON m.sender_id = p.id
      WHERE m.ticket_id = $1
      ORDER BY m.created_at ASC
    `, [id]);

    let relatedOrders: any[] = [];
    if (ticket.subject === 'Pesanan' && ticket.order_id) {
      const orderIds = ticket.order_id.split(',')
        .map((oId: string) => parseInt(oId.trim(), 10))
        .filter((oId: number) => !isNaN(oId));
      if (orderIds.length > 0) {
        const ordersRes = await query(
          'SELECT order_id, id, service_name, target_url, quantity, total_price, status, provider_order_id, created_at FROM orders WHERE order_id = ANY($1)',
          [orderIds]
        );
        relatedOrders = ordersRes.rows;
      }
    }

    return NextResponse.json({
      success: true,
      ticket,
      messages: messagesRes.rows,
      orders: relatedOrders
    });
  } catch (err: any) {
    console.error('Error fetching ticket detail:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const { message, image_url } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Pesan wajib diisi.' }, { status: 400 });
    }

    // Fetch ticket and user info
    const ticketRes = await query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketRes.rows[0];

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan.' }, { status: 404 });
    }

    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    // Verify ownership
    if (userRole !== 'admin' && ticket.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Determine sender role and new status
    const senderRole = userRole === 'admin' ? 'admin' : 'user';
    const newStatus = senderRole === 'admin' ? 'Answered' : 'Pending';

    // Insert new message
    await query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message, image_url) VALUES ($1, $2, $3, $4, $5)',
      [id, decoded.userId, senderRole, message, image_url || null]
    );

    // Update ticket status & updated_at timestamp
    await query(
      'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil dikirim!'
    });
  } catch (err: any) {
    console.error('Error sending message:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi.' }, { status: 400 });
    }

    // Fetch ticket and user info
    const ticketRes = await query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketRes.rows[0];

    if (!ticket) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan.' }, { status: 404 });
    }

    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    // Only admin can change status directly via PATCH
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Update status
    await query(
      'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Status tiket berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Error updating ticket status:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Delete messages first, then ticket
    await query('DELETE FROM ticket_messages WHERE ticket_id = $1', [id]);
    await query('DELETE FROM tickets WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil dihapus!'
    });
  } catch (err: any) {
    console.error('Error deleting ticket:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
