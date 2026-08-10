import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qr_id = searchParams.get('qr_id');

    if (!qr_id) {
      return NextResponse.json({ error: 'qr_id parameter is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/payment/status?qr_id=${qr_id}`);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error(`[API Proxy] Failed to verify payment status via backend:`, error);
    return NextResponse.json({ error: 'Failed to verify payment status via backend', details: error.message }, { status: 502 });
  }
}
