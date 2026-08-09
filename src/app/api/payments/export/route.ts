import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { getRazorpayInstance } from '@/lib/razorpayHelper';

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

export async function GET() {
  try {
    const db = getDb();
    const machinesSnap = await db.collection('machines').get();
    const allPaymentsPromises = machinesSnap.docs.map((doc: any) => getPaymentsForMachine(doc.id));
    
    const results = await Promise.all(allPaymentsPromises);
    const aggregatedPayments = results.reduce((acc: any[], val: any[]) => acc.concat(val), []);
    aggregatedPayments.sort((a: any, b: any) => b.created_at - a.created_at);

    let csv = 'Payment ID,Machine ID,Date,Amount (INR),Method,Status,Customer Email,Customer Contact\n';
    aggregatedPayments.forEach((p: any) => {
      const date = new Date(p.created_at * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const amount = (p.amount / 100).toFixed(2);
      const email = p.email || 'N/A';
      const contact = p.contact || 'N/A';
      const mId = p.machineId || 'N/A';
      csv += `"${p.id}","${mId}","${date}",${amount},"${p.method}","${p.status}","${email}","${contact}"\n`;
    });
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=freshpod_payments.csv'
      }
    });
  } catch (error: any) {
    console.error('Export error:', error.message || error);
    return new Response('Export failed', { status: 500 });
  }
}
