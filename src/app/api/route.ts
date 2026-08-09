import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    version: '2.1.0',
    service: 'FreshPod Dynamic Multi-Tenant API'
  });
}
