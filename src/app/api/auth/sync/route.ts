import { NextRequest, NextResponse } from 'next/server';
import { db, authAdmin } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Auth token missing' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { uid, email } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // 1. Check if this is the first user in the system
      const usersSnap = await db.collection('users').limit(1).get();
      if (usersSnap.empty) {
        const newAdmin = {
          uid,
          email,
          role: 'admin',
          createdAt: Date.now()
        };
        await userDocRef.set(newAdmin);
        console.log(`[BOOTSTRAP] Registered first user ${email} as Admin.`);
        return NextResponse.json(newAdmin);
      }

      // 2. Check if this email was pre-registered
      const placeholderDocRef = db.collection('users').doc(email.toLowerCase());
      const placeholderDoc = await placeholderDocRef.get();

      if (placeholderDoc.exists) {
        const placeholderData = placeholderDoc.data() || {};
        const linkedVendor = {
          uid,
          email,
          role: placeholderData.role,
          machineId: placeholderData.machineId,
          location: placeholderData.location,
          createdAt: Date.now()
        };

        await userDocRef.set(linkedVendor);
        await placeholderDocRef.delete();
        console.log(`[AUTH] Linked pre-registered email ${email} to UID ${uid}`);
        return NextResponse.json(linkedVendor);
      }

      return NextResponse.json({ error: 'Registration restricted. Admin registration required.' }, { status: 403 });
    }

    return NextResponse.json({ uid, ...userDoc.data() });
  } catch (err: any) {
    console.error('[AUTH] Sync error:', err.message);
    return NextResponse.json({ error: 'Internal Auth Sync Error', details: err.message }, { status: 500 });
  }
}
