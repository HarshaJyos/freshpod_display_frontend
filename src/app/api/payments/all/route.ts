import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAuthAdmin } from '@/lib/firebaseAdmin';
import { getRazorpayInstance } from '@/lib/razorpayHelper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function verifyUser(request: NextRequest) {
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
  if (!userDoc.exists) {
    throw new Error('Forbidden');
  }
  return { uid, user: userDoc.data() };
}

const getPaymentsForMachine = async (machineId: string): Promise<any[]> => {
  try {
    const { instance } = await getRazorpayInstance(machineId);
    const response = await instance.payments.all({ count: 100 });
    return (response.items || []).map((p: any) => ({
      ...p,
      machineId
    }));
  } catch (err: any) {
    console.error(`[PAYMENT] Error fetching payments for machine ${machineId}:`, err.message);
    return [];
  }
};

export async function GET(request: NextRequest) {
  let user: any;
  try {
    const result = await verifyUser(request);
    user = result.user;
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Auth token missing' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    if (user.role === 'admin') {
      const machinesSnap = await db.collection('machines').get();
      const allPaymentsPromises = machinesSnap.docs.map((doc: any) => getPaymentsForMachine(doc.id));
      const results = await Promise.all(allPaymentsPromises);
      const aggregatedPayments = results.reduce((acc: any[], val: any[]) => acc.concat(val), []);
      aggregatedPayments.sort((a: any, b: any) => b.created_at - a.created_at);
      return NextResponse.json(aggregatedPayments);
    } else {
      const mId = user.machineId;
      if (!mId) return NextResponse.json([]);
      const payments = await getPaymentsForMachine(mId);
      return NextResponse.json(payments);
    }
  } catch (err: any) {
    console.error('[API] Error retrieving dashboard payments:', err.message);
    return NextResponse.json({ error: 'Failed to retrieve transactions', details: err.message }, { status: 500 });
  }
}
