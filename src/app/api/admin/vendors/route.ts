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
    const { email, machineId, location, amount, razorpayKeyId, razorpayKeySecret } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const db = getDb();

    // 1. Create/Update user placeholder doc keyed by email
    const placeholderDocRef = db.collection('users').doc(email.toLowerCase());
    const existingPlaceholder = await placeholderDocRef.get();
    
    // Check if user already exists
    const usersSnap = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    let userUid: string | null = null;
    if (!usersSnap.empty) {
      userUid = usersSnap.docs[0].id;
    }

    const payload = {
      role: 'vendor',
      machineId: machineId || '',
      location: location || 'Not Set',
      createdAt: existingPlaceholder.exists ? existingPlaceholder.data()?.createdAt : Date.now()
    };

    if (userUid) {
      // User is already logged in, update actual UID doc directly
      await db.collection('users').doc(userUid).update(payload);
      console.log(`[ADMIN] Updated vendor user doc directly for ${email}`);
    } else {
      // Save as email-keyed placeholder
      await placeholderDocRef.set(payload);
      console.log(`[ADMIN] Created/Updated email-keyed placeholder for ${email}`);
    }

    // 2. Create/Update machine config in firestore
    if (machineId) {
      const machineDocRef = db.collection('machines').doc(machineId);
      await machineDocRef.set({
        vendorUid: userUid || email.toLowerCase(),
        location: location || 'Not Set',
        amount: Number(amount) || 50,
        razorpayKeyId: razorpayKeyId || '',
        razorpayKeySecret: razorpayKeySecret || '',
        updatedAt: Date.now()
      });
      console.log(`[ADMIN] Configured machine ${machineId}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ADMIN] Register vendor error:', err.message);
    return NextResponse.json({ error: 'Failed to configure vendor profile', details: err.message }, { status: 500 });
  }
}
