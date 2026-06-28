import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

const PUBLIC_TABLES = ['services', 'announcements'];
const ALLOWED_TABLES = ['profiles', 'services', 'orders', 'transactions', 'announcements'];

async function getSessionUser(request: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  if (!token) {
    const authHeader = request.headers.get('Authorization') || '';
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) return null;

  try {
    const jwtSecret = process.env.JWT_SECRET || 'buzzify_secret_key_1234567890';
    const decoded: any = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (e) {
    return null;
  }
}

// Helper to check table exists and name is clean to prevent SQL injection
function isValidTable(table: string): boolean {
  return ALLOWED_TABLES.includes(table);
}

// GET - Read records
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    
    if (!isValidTable(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const user = await getSessionUser(request);
    const isPublic = PUBLIC_TABLES.includes(table);

    if (!isPublic && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterCol = searchParams.get('filter_col');
    const filterVal = searchParams.get('filter_val');
    const orderCol = searchParams.get('order_col');
    const orderDir = searchParams.get('order_dir') || 'ASC';
    const single = searchParams.get('single') === 'true';
    const maybeSingle = searchParams.get('maybe_single') === 'true';

    // RLS emulation: Restrict non-admins to their own records
    let rlsFilterCol = filterCol;
    let rlsFilterVal = filterVal;

    if (user && user.role !== 'admin' && !isPublic) {
      if (table === 'profiles') {
        rlsFilterCol = 'id';
        rlsFilterVal = user.userId;
      } else if (table === 'orders' || table === 'transactions') {
        rlsFilterCol = 'user_id';
        rlsFilterVal = user.userId;
      }
    }

    // Build query safely
    let sql = `SELECT * FROM ${table}`;
    const queryParams: any[] = [];

    if (rlsFilterCol && rlsFilterVal !== null) {
      // Basic sanitize of column name
      const cleanCol = rlsFilterCol.replace(/[^a-zA-Z0-9_]/g, '');
      sql += ` WHERE ${cleanCol} = $1`;
      queryParams.push(rlsFilterVal);
    }

    if (orderCol) {
      const cleanOrderCol = orderCol.replace(/[^a-zA-Z0-9_]/g, '');
      const cleanDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${cleanOrderCol} ${cleanDir}`;
    } else if (table === 'announcements') {
      sql += ` ORDER BY is_pinned DESC, created_at DESC`;
    }

    if (single || maybeSingle) {
      sql += ' LIMIT 1';
    }

    const res = await query(sql, queryParams);

    if (single || maybeSingle) {
      if (res.rows.length === 0) {
        if (maybeSingle) {
          return NextResponse.json(null);
        }
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(res.rows[0]);
    }

    return NextResponse.json(res.rows);

  } catch (err: any) {
    console.error('Error in GET DB route:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

// POST - Insert record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!isValidTable(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const user = await getSessionUser(request);

    // Only admin can insert services and announcements
    if (PUBLIC_TABLES.includes(table)) {
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } else if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // RLS emulation: Force user_id to current user for non-admins
    if (user && user.role !== 'admin') {
      if (table === 'orders') {
        body.user_id = user.userId;
        // Make sure status is pending and payment_status is unpaid by default if created directly
        body.status = 'pending';
        body.payment_status = 'unpaid';
      } else if (table === 'transactions') {
        body.user_id = user.userId;
        // SECURITY FIX: Prevent non-admin from inserting positive transactions or successful transactions!
        const amount = parseFloat(body.amount);
        if (amount >= 0) {
          return NextResponse.json({ error: 'Forbidden: Cannot insert positive transactions' }, { status: 403 });
        }
        if (body.type !== 'order_payment') {
          return NextResponse.json({ error: 'Forbidden: Invalid transaction type' }, { status: 403 });
        }
        body.status = 'success'; // spent money is marked as success immediately
      } else {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
    }

    // Build dynamic insert
    const keys = Object.keys(body).map(k => k.replace(/[^a-zA-Z0-9_]/g, ''));
    const values = Object.values(body);
    const valuePlaceholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { searchParams } = new URL(request.url);
    const isUpsert = searchParams.get('upsert') === 'true';

    let sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${valuePlaceholders})`;
    
    if (isUpsert) {
      const updatePhrases = keys.filter(k => k !== 'id').map(k => `${k} = EXCLUDED.${k}`).join(', ');
      sql += ` ON CONFLICT (id) DO UPDATE SET ${updatePhrases}`;
    }
    
    sql += ` RETURNING *`;
    const res = await query(sql, values);

    return NextResponse.json(res.rows[0]);

  } catch (err: any) {
    console.error('Error in POST DB route:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

// PATCH - Update record
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!isValidTable(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const user = await getSessionUser(request);

    // Only admin can update services and announcements
    if (PUBLIC_TABLES.includes(table)) {
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } else if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterCol = searchParams.get('filter_col');
    const filterVal = searchParams.get('filter_val');

    if (!filterCol || filterVal === null) {
      return NextResponse.json({ error: 'Missing filter query' }, { status: 400 });
    }

    const body = await request.json();

    // RLS emulation: Restrict non-admins to updating their own data
    let rlsFilterCol = filterCol;
    let rlsFilterVal = filterVal;
    let extraWhereClause = '';
    const extraParams = [];

    if (user && user.role !== 'admin') {
      if (table === 'profiles') {
        rlsFilterCol = 'id';
        rlsFilterVal = user.userId;
        // Make sure non-admin cannot alter their role
        delete body.role;
        
        // SECURITY FIX: Prevent non-admin from increasing their balance!
        if (body.balance !== undefined) {
          const currentRes = await query('SELECT balance FROM profiles WHERE id = $1', [user.userId]);
          const currentBalance = parseFloat(currentRes.rows[0]?.balance || '0');
          const newBalance = parseFloat(body.balance);
          if (newBalance > currentBalance) {
            return NextResponse.json({ error: 'Forbidden: Cannot increase balance' }, { status: 403 });
          }
          if (newBalance < 0) {
            return NextResponse.json({ error: 'Bad Request: Balance cannot be negative' }, { status: 400 });
          }
        }
        // Prevent altering email
        delete body.email;
      } else if (table === 'orders') {
        // Keep primary filter column (like id) intact, but enforce user ownership check
        extraWhereClause = ` AND user_id = $${Object.keys(body).length + 2}`;
        extraParams.push(user.userId);
        
        // SECURITY FIX: Prevent non-admin from updating status or payment_status to paid directly!
        if (body.payment_status === 'paid' || body.status === 'processing' || body.status === 'success') {
          return NextResponse.json({ error: 'Forbidden: Cannot update order status directly' }, { status: 403 });
        }
      } else if (table === 'transactions') {
        // Keep primary filter column (like id) intact, but enforce user ownership check
        extraWhereClause = ` AND user_id = $${Object.keys(body).length + 2}`;
        extraParams.push(user.userId);
        
        // SECURITY FIX: Prevent non-admin from updating status to success directly!
        if (body.status === 'success') {
          return NextResponse.json({ error: 'Forbidden: Cannot approve transactions directly' }, { status: 403 });
        }
      } else {
        // services, announcements
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
    }

    // Build dynamic UPDATE query
    const setKeys = Object.keys(body).map(k => k.replace(/[^a-zA-Z0-9_]/g, ''));
    const setValues = Object.values(body);

    if (setKeys.length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const setPhrases = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const cleanFilterCol = rlsFilterCol.replace(/[^a-zA-Z0-9_]/g, '');
    
    const sql = `UPDATE ${table} SET ${setPhrases} WHERE ${cleanFilterCol} = $${setValues.length + 1}${extraWhereClause} RETURNING *`;
    const res = await query(sql, [...setValues, rlsFilterVal, ...extraParams]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);

  } catch (err: any) {
    console.error('Error in PATCH DB route:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

// DELETE - Delete record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;

    if (!isValidTable(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete public tables (services, announcements)
    if (PUBLIC_TABLES.includes(table) && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterCol = searchParams.get('filter_col');
    const filterVal = searchParams.get('filter_val');

    if (!filterCol || filterVal === null) {
      return NextResponse.json({ error: 'Missing filter query' }, { status: 400 });
    }

    // RLS emulation: Restrict non-admins to deleting their own data
    let rlsFilterCol = filterCol;
    let rlsFilterVal = filterVal;
    let extraWhereClause = '';
    const extraParams: any[] = [];

    if (user && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const cleanFilterCol = rlsFilterCol.replace(/[^a-zA-Z0-9_]/g, '');
    const sql = `DELETE FROM ${table} WHERE ${cleanFilterCol} = $1${extraWhereClause} RETURNING *`;
    const res = await query(sql, [rlsFilterVal, ...extraParams]);

    return NextResponse.json({ success: true, count: res.rowCount, deleted: res.rows });

  } catch (err: any) {
    console.error('Error in DELETE DB route:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
