/**
 * /api/gas/route.ts — GAS Proxy (แก้ปัญหา CORS)
 * รับ request จาก browser → ส่งต่อไปยัง GAS Web App server-side
 * เพราะ GAS ไม่รองรับ CORS สำหรับ POST จาก browser โดยตรง
 */

import { NextRequest, NextResponse } from 'next/server';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL!;

// ─── GET (proxy สำหรับ action ที่ใช้ GET) ─────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!GAS_URL) {
    return NextResponse.json({ success: false, error: 'GAS_URL not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const gasUrl = new URL(GAS_URL);
  searchParams.forEach((v, k) => gasUrl.searchParams.set(k, v));

  try {
    const res  = await fetch(gasUrl.toString(), { redirect: 'follow' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ─── POST (proxy สำหรับ action ที่ต้องการ write) ─────────────────────────────
export async function POST(req: NextRequest) {
  if (!GAS_URL) {
    return NextResponse.json({ success: false, error: 'GAS_URL not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const res = await fetch(GAS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      redirect: 'follow',
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
