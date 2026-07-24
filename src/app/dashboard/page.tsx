'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';

interface Transaction {
  id: string;
  created_at: number;
  amount: number;
  method: string;
  status: string;
  email?: string;
  contact?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [errorTransactions, setErrorTransactions] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setCheckingAuth(false);
        await loadConfig();
        await loadTransactions();
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const loadConfig = async () => {
    try {
      const configRef = doc(db, 'config', 'kiosk');
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) {
        setAmount(docSnap.data().amount?.toString() || '50');
      } else {
        setAmount('50');
      }
    } catch (err) {
      console.error('Failed to load Firestore config:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      setErrorTransactions(false);
      setLoadingTransactions(true);
      
      const res = await fetch(`${backendUrl}/api/payments/all`);
      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setErrorTransactions(true);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setUpdating(true);

    const price = parseInt(amount, 10);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price amount');
      setUpdating(false);
      return;
    }

    try {
      const configRef = doc(db, 'config', 'kiosk');
      await setDoc(configRef, {
        amount: price,
        updatedAt: Date.now()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to update config in Firestore:', err);
      alert('Permission denied. Check Firestore security rules.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
        Validating Admin Credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              FreshPod Transaction Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-normal font-sans">
              Live payment records retrieved securely from Razorpay API
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`${backendUrl}/api/payments/export`}
              download
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              Export to CSV (Excel)
            </a>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Log Out
            </Button>
          </div>
        </header>

        {/* Dynamic Success Alert */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 shadow-sm">
            Kiosk payment settings updated successfully in Firestore. Previous active QR session cache has been reset.
          </div>
        )}

        {/* Kiosk Configuration Form */}
        <Card className="mb-6 border-slate-200 bg-white p-6 shadow-sm rounded-xl">
          <form onSubmit={handleUpdatePrice} className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="price" className="text-sm font-bold text-slate-700">
                Kiosk Payment Price (INR)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 font-semibold">₹</span>
                <Input
                  id="price"
                  type="number"
                  required
                  min="1"
                  className="max-w-[120px] border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                  disabled={updating}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={updating}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all"
              >
                {updating ? 'Updating...' : 'Update Price'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Transactions Logs Table */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Date & Time</TableHead>
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Payment ID</TableHead>
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Amount</TableHead>
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Method</TableHead>
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Status</TableHead>
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Contact Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                      Loading payment logs...
                    </TableCell>
                  </TableRow>
                ) : errorTransactions ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-red-600 font-medium">
                      Failed to fetch logs. Verify connection to backend API server.
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-medium">
                      No transaction records retrieved.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const dateString = new Date(tx.created_at * 1000).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata'
                    });
                    const formattedAmount = (tx.amount / 100).toFixed(2);
                    const statusClass =
                      tx.status === 'captured'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : tx.status === 'failed'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : tx.status === 'authorized'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200';
                    const contactDetail = tx.contact || tx.email || 'N/A';

                    return (
                      <TableRow key={tx.id} className="hover:bg-slate-50/75 border-slate-100 transition-colors">
                        <TableCell className="px-6 py-4 text-slate-600 font-medium">{dateString}</TableCell>
                        <TableCell className="px-6 py-4 font-mono text-slate-500 text-xs">{tx.id}</TableCell>
                        <TableCell className="px-6 py-4 font-bold text-slate-900">₹{formattedAmount}</TableCell>
                        <TableCell className="px-6 py-4 capitalize text-slate-600">{tx.method}</TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-500 text-sm">{contactDetail}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
