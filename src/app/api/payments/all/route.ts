import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const machineId = searchParams.get('machineId');
  const authHeader = request.headers.get('authorization');

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const url = `${backendUrl}/api/payments/all` + (machineId ? `?machineId=${machineId}` : '');

    const headers: HeadersInit = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error(`[API Proxy] Failed to fetch payments list via backend:`, error);
    return NextResponse.json({ error: 'Failed to retrieve transactions via backend', details: error.message }, { status: 502 });
  }
}
