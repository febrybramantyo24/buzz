import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query("SELECT key, value FROM site_settings");
    const settings: Record<string, string> = {};
    res.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error('Error fetching public site settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
