import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpayHelper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const machineId = searchParams.get('machineId');

  if (!machineId) {
    return NextResponse.json({ error: 'machineId parameter is required' }, { status: 400 });
  }

  try {
    const { instance } = await getRazorpayInstance(machineId);
    const response = await instance.payments.all({ count: 100 });
    const payments = (response.items || []).map((p: any) => ({
      ...p,
      machineId
    }));
    return NextResponse.json(payments);
  } catch (err: any) {
    console.error(`[PAYMENT] Error fetching payments for machine ${machineId}:`, err.message);
    return NextResponse.json({ error: 'Failed to retrieve transactions', details: err.message }, { status: 500 });
  }
}
