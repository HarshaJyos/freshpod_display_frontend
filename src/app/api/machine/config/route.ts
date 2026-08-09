import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAuthAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.split('Bearer ')[1];
  const authAdmin = getAuthAdmin();
  const db = getDb();
  const decodedToken = await authAdmin.verifyIdToken(token);
  const { uid } = decodedToken;
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return { uid, user: userDoc.data() };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const machine_id = searchParams.get('machine_id');

  if (!machine_id) {
    return NextResponse.json({ error: 'machine_id parameter is required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const machineDoc = await db.collection('machines').doc(machine_id).get();
    if (!machineDoc.exists) {
      return NextResponse.json({
        machineId: machine_id,
        location: 'Not Configured',
        amount: Number(process.env.QR_AMOUNT) || 50,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        updatedAt: Date.now()
      });
    }

    const data = machineDoc.data() || {};
    return NextResponse.json({
      machineId: machine_id,
      location: data.location,
      amount: data.amount,
      razorpayKeyId: data.razorpayKeyId || '',
      updatedAt: data.updatedAt
    });
  } catch (err: any) {
    console.error('[DB] Fetch machine config error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch machine config', details: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Auth token missing' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { machineId, location, amount, razorpayKeyId, razorpayKeySecret } = await request.json();
    if (!machineId) {
      return NextResponse.json({ error: 'machineId is required' }, { status: 400 });
    }

    const db = getDb();
    const machineDocRef = db.collection('machines').doc(machineId);
    const existingDoc = await machineDocRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};

    await machineDocRef.set({
      vendorUid: existingData?.vendorUid || 'admin',
      location: location || existingData?.location || 'Not Set',
      amount: Number(amount) || existingData?.amount || 50,
      razorpayKeyId: razorpayKeyId || existingData?.razorpayKeyId || '',
      razorpayKeySecret: razorpayKeySecret || existingData?.razorpayKeySecret || '',
      updatedAt: Date.now()
    });

    console.log(`[ADMIN] Updated machine config for ${machineId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ADMIN] Update machine config error:', err.message);
    return NextResponse.json({ error: 'Failed to update machine config', details: err.message }, { status: 500 });
  }
}
