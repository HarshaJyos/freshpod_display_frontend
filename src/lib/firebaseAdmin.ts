import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[FIREBASE ADMIN] Initialized using Service Account JSON.');
    } catch (err: any) {
      console.error('[FIREBASE ADMIN] Error parsing Service Account JSON:', err.message);
      initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'freshpod-901ed' });
    }
  } else {
    initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'freshpod-901ed' });
    console.log('[FIREBASE ADMIN] Initialized using Project ID fallback.');
  }
}

export const db = getFirestore();
export const authAdmin = getAuth();
