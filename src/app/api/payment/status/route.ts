import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance, linkCache } from '@/lib/razorpayHelper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qr_id = searchParams.get('qr_id');

  if (!qr_id) {
    return NextResponse.json({ error: 'qr_id parameter is required' }, { status: 400 });
  }

  // 1. Locate machine ID from the cached payment link
  let machineId = 'default';
  for (const [mId, cached] of linkCache.entries()) {
    if (cached.id === qr_id) {
      machineId = mId;
      break;
    }
  }

  try {
    const { instance } = await getRazorpayInstance(machineId);

    // 2. Fetch payment link details from Razorpay
    const paymentLink = await instance.paymentLink.fetch(qr_id);

    // Status mapping: 'created' (pending), 'paid' (paid), 'expired' / 'cancelled' (failed)
    let status = 'pending';
    if (paymentLink.status === 'paid') {
      status = 'paid';
      // Clean up cache once transaction is paid
      if (machineId !== 'default') {
        linkCache.delete(machineId);
      }
    } else if (paymentLink.status === 'expired' || paymentLink.status === 'cancelled') {
      status = 'failed';
    }

    return NextResponse.json({ qr_id, status });
  } catch (error: any) {
    console.error(`[API] Failed to verify payment status:`, error);
    const details = error.description || error.message || (error.error && error.error.description) || JSON.stringify(error);
    return NextResponse.json({ error: 'Failed to verify payment status', details }, { status: 502 });
  }
}
