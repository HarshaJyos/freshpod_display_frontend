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
  try {
    await verifyAdmin(request);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Auth token missing' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const db = getDb();
    const usersSnap = await db.collection('users').get();
    const usersList: any[] = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      usersList.push({
        id: doc.id,
        ...data
      });
    });
    return NextResponse.json(usersList);
  } catch (err: any) {
    console.error('[ADMIN] Fetch users error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch users', details: err.message }, { status: 500 });
  }
}
