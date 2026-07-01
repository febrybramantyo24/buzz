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

export async function GET(request: Request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    // Check user role
    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    if (userRole === 'admin') {
      // Admin gets all tickets
      const ticketsRes = await query(`
        SELECT t.*, p.username, p.full_name, p.email 
        FROM tickets t 
        JOIN profiles p ON t.user_id = p.id 
        ORDER BY t.updated_at DESC
      `);
      return NextResponse.json({ success: true, tickets: ticketsRes.rows });
    } else {
      // User gets only their tickets
      const ticketsRes = await query('SELECT * FROM tickets WHERE user_id = $1 ORDER BY updated_at DESC', [decoded.userId]);
      return NextResponse.json({ success: true, tickets: ticketsRes.rows });
    }
  } catch (err: any) {
    console.error('Error fetching tickets:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const { subject, message, image_url, order_id, request_type, deposit_id } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subjek dan Pesan wajib diisi.' }, { status: 400 });
    }

    // Validate order_id ownership if subject is 'Pesanan'
    if (subject === 'Pesanan') {
      if (!order_id) {
        return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
      }
      
      const orderIds = order_id.split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0)
        .map((id: string) => {
          const parsed = parseInt(id, 10);
          return isNaN(parsed) ? null : parsed;
        })
        .filter((id: number | null) => id !== null) as number[];

      if (orderIds.length === 0) {
        return NextResponse.json({ error: 'Order ID tidak valid.' }, { status: 400 });
      }

      const checkRes = await query(
        'SELECT order_id FROM orders WHERE user_id = $1 AND order_id = ANY($2)',
        [decoded.userId, orderIds]
      );
      const foundOrderIds = checkRes.rows.map((row: any) => row.order_id);
      
      const originalIds = order_id.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
      const invalidIds = originalIds.filter((id: string) => {
        const parsed = parseInt(id, 10);
        return isNaN(parsed) || !foundOrderIds.includes(parsed);
      });

      if (invalidIds.length > 0) {
        return NextResponse.json({ 
          error: `Order ID berikut tidak valid atau bukan milik Anda: ${invalidIds.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate deposit_id ownership if subject is 'Deposit'
    if (subject === 'Deposit') {
      if (!deposit_id) {
        return NextResponse.json({ error: 'ID Deposit wajib diisi.' }, { status: 400 });
      }
      const cleanIdStr = deposit_id.toLowerCase().replace('trx-', '').replace('trx', '').trim();
      const txIdNum = parseInt(cleanIdStr, 10);
      if (isNaN(txIdNum)) {
        return NextResponse.json({ error: 'ID Deposit tidak valid.' }, { status: 400 });
      }

      const checkRes = await query(
        'SELECT tx_id FROM transactions WHERE user_id = $1 AND tx_id = $2',
        [decoded.userId, txIdNum]
      );

      if (checkRes.rows.length === 0) {
        return NextResponse.json({ error: 'ID Deposit tidak valid atau bukan milik Anda.' }, { status: 400 });
      }
    }

    // Insert new ticket
    const ticketInsertRes = await query(
      'INSERT INTO tickets (user_id, subject, status, order_id, request_type, deposit_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [decoded.userId, subject, 'Pending', order_id || null, request_type || null, deposit_id || null]
    );
    const newTicket = ticketInsertRes.rows[0];

    // Insert first message
    await query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message, image_url) VALUES ($1, $2, $3, $4, $5)',
      [newTicket.id, decoded.userId, 'user', message, image_url || null]
    );

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: 'Tiket bantuan berhasil dikirim!'
    });
  } catch (err: any) {
    console.error('Error creating ticket:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { ticketIds, status } = await request.json();
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: 'Ticket ID tidak valid.' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi.' }, { status: 400 });
    }

    await query(
      'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      [status, ticketIds]
    );

    return NextResponse.json({
      success: true,
      message: 'Status tiket bantuan berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Error updating tickets in bulk:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    const userRes = await query('SELECT role FROM profiles WHERE id = $1', [decoded.userId]);
    const userRole = userRes.rows[0]?.role;

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { ticketIds } = await request.json();
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: 'Ticket ID tidak valid.' }, { status: 400 });
    }

    await query('DELETE FROM ticket_messages WHERE ticket_id = ANY($1)', [ticketIds]);
    await query('DELETE FROM tickets WHERE id = ANY($1)', [ticketIds]);

    return NextResponse.json({
      success: true,
      message: 'Tiket bantuan berhasil dihapus!'
    });
  } catch (err: any) {
    console.error('Error deleting tickets:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
