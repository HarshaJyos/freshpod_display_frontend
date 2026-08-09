import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        return initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (err: any) {
        console.error('[FIREBASE ADMIN] Error parsing Service Account JSON:', err.message);
        return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'freshpod-901ed' });
      }
    } else {
      console.log('[FIREBASE ADMIN] Initializing using Project ID fallback.');
      return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'freshpod-901ed' });
    }
  }
  return getApp();
}

export const getDb = () => {
  getFirebaseAdminApp();
  return getFirestore();
};

export const getAuthAdmin = () => {
  getFirebaseAdminApp();
  return getAuth();
};
