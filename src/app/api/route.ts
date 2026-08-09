import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    version: '2.1.0',
    service: 'FreshPod Dynamic Multi-Tenant API'
  });
}
