import Razorpay from 'razorpay';
import { db } from './firebaseAdmin';

export interface MachineConfig {
  machineId: string;
  vendorUid: string;
  location: string;
  amount: number;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  updatedAt: number;
}

export const linkCache = new Map<string, { id: string; short_url: string; amount: number; machineId: string }>();

export const getRazorpayInstance = async (machineId: string): Promise<{ instance: Razorpay; config: MachineConfig }> => {
  let config: MachineConfig = {
    machineId,
    vendorUid: '',
    location: 'Fallback Default',
    amount: Number(process.env.QR_AMOUNT) || 50,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    updatedAt: Date.now()
  };

  try {
    const machineDoc = await db.collection('machines').doc(machineId).get();
    if (machineDoc.exists) {
      const data = machineDoc.data() || {};
      config = {
        machineId,
        vendorUid: data.vendorUid || '',
        location: data.location || 'Fallback Default',
        amount: Number(data.amount) || Number(process.env.QR_AMOUNT) || 50,
        razorpayKeyId: data.razorpayKeyId,
        razorpayKeySecret: data.razorpayKeySecret,
        updatedAt: data.updatedAt || Date.now()
      };
    }
  } catch (err: any) {
    console.error(`[DB] Error fetching machine config for ${machineId}:`, err.message);
  }

  const keyId = config.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '';
  const keySecret = config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';

  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  return { instance, config };
};
