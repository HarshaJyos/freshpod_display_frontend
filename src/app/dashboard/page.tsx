'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
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
  machineId?: string;
  created_at: number;
  amount: number;
  method: string;
  status: string;
  email?: string;
  contact?: string;
}

interface UserProfile {
  email: string;
  role: 'admin' | 'vendor';
  machineId?: string;
  location?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Auth and profile states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Vendor machine states
  const [machineId, setMachineId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Admin registration form states
  const [newEmail, setNewEmail] = useState('');
  const [newMachineId, setNewMachineId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newAmount, setNewAmount] = useState('50');
  const [newKeyId, setNewKeyId] = useState('');
  const [newKeySecret, setNewKeySecret] = useState('');
  const [registeringVendor, setRegisteringVendor] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Transactions logs states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [errorTransactions, setErrorTransactions] = useState(false);

  // Admin aggregated stats
  const [allMachines, setAllMachines] = useState<any[]>([]);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');

  const auth = getAuth(app);
  const db = getFirestore(app);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setFirebaseUser(user);
        await syncUserProfile(user);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  // Authenticate against backend and synchronize session profile
  const syncUserProfile = async (user: User) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${backendUrl}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Authentication sync failed');
      }
      const data = (await res.json()) as UserProfile;
      setProfile(data);
      setCheckingAuth(false);

      if (data.role === 'vendor' && data.machineId) {
        setMachineId(data.machineId);
        setLocation(data.location || '');
        await loadMachineConfig(data.machineId);
        await loadTransactions(token);
      } else if (data.role === 'admin') {
        await loadAdminMachines();
        await loadTransactions(token);
      }
    } catch (err) {
      console.error('Failed to sync profile:', err);
      signOut(auth);
      router.push('/login');
    }
  };

  // Vendor: Load specific machine config from Firestore
  const loadMachineConfig = async (mId: string) => {
    try {
      const configRef = doc(db, 'machines', mId);
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) {
        setAmount(docSnap.data().amount?.toString() || '50');
      } else {
        setAmount('50');
      }
    } catch (err) {
      console.error('Failed to load machine configuration:', err);
    }
  };

  // Admin: Load all registered machines to summarize location and status
  const loadAdminMachines = async () => {
    try {
      const snap = await getDocs(collection(db, 'machines'));
      const machinesList = snap.docs.map(d => ({
        machineId: d.id,
        ...d.data()
      }));
      setAllMachines(machinesList);
    } catch (err) {
      console.error('Failed to load registered machines list:', err);
    }
  };

  // Load Transactions logs securely via backend
  const loadTransactions = async (tokenOverride?: string) => {
    try {
      setErrorTransactions(false);
      setLoadingTransactions(true);
      
      const token = tokenOverride || (firebaseUser ? await firebaseUser.getIdToken() : '');
      const res = await fetch(`${backendUrl}/api/payments/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions list:', err);
      setErrorTransactions(true);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Vendor: Update specific machine price in Firestore
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriceSuccess(false);
    setUpdatingPrice(true);

    const price = parseInt(amount, 10);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid amount');
      setUpdatingPrice(false);
      return;
    }

    try {
      const configRef = doc(db, 'machines', machineId);
      await setDoc(configRef, {
        amount: price,
        updatedAt: Date.now()
      }, { merge: true });

      setPriceSuccess(true);
      setTimeout(() => setPriceSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to write machine config:', err);
      alert('Failed to update price. Permission denied.');
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Admin: Register a new vendor and their credentials on the backend
  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);
    setRegisteringVendor(true);

    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : '';
      const res = await fetch(`${backendUrl}/api/admin/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          machineId: newMachineId,
          location: newLocation,
          amount: parseInt(newAmount, 10),
          razorpayKeyId: newKeyId,
          razorpayKeySecret: newKeySecret
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register vendor');
      }

      setRegisterSuccess(true);
      setNewEmail('');
      setNewMachineId('');
      setNewLocation('');
      setNewAmount('50');
      setNewKeyId('');
      setNewKeySecret('');
      
      await loadAdminMachines(); // Refresh lists
    } catch (err: any) {
      console.error('Registration failed:', err);
      setRegisterError(err.message || 'Failed to complete registration.');
    } finally {
      setRegisteringVendor(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (checkingAuth || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
        Loading freshpod SaaS portal...
      </div>
    );
  }

  // Filtered transactions for Admin view
  const filteredTransactions = selectedMachineFilter === 'all'
    ? transactions
    : transactions.filter(t => t.machineId === selectedMachineFilter);

  // Revenue metrics calculation
  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'captured')
    .reduce((sum, t) => sum + t.amount / 100, 0);

  const successfulPaymentsCount = filteredTransactions.filter(t => t.status === 'captured').length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Top Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              FreshPod SaaS Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-normal font-sans">
              Logged in as <span className="font-semibold text-slate-700">{profile.email}</span> ({profile.role})
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

        {/* Dynamic Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="border-slate-200 bg-white p-6 shadow-sm rounded-xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Revenue (INR)</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">₹{totalRevenue.toFixed(2)}</div>
          </Card>
          <Card className="border-slate-200 bg-white p-6 shadow-sm rounded-xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Successful Cycles</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{successfulPaymentsCount}</div>
          </Card>
        </div>

        {/* VENDOR CONTROL PANEL */}
        {profile.role === 'vendor' && (
          <Card className="mb-6 border-slate-200 bg-white p-6 shadow-sm rounded-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Machine Settings ({machineId})</h2>
            <p className="text-slate-500 text-xs mb-4">Location: <span className="font-medium text-slate-700">{location}</span></p>
            
            {priceSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800 shadow-sm">
                Kiosk price updated successfully in Firestore!
              </div>
            )}

            <form onSubmit={handleUpdatePrice} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <label htmlFor="price" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Payment Price (INR)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 font-bold text-lg">₹</span>
                  <Input
                    id="price"
                    type="number"
                    required
                    min="1"
                    className="max-w-[120px] border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    disabled={updatingPrice}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={updatingPrice}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all"
                >
                  {updatingPrice ? 'Updating...' : 'Update Price'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ADMIN CONTROL PANEL: Pre-register Vendors */}
        {profile.role === 'admin' && (
          <Card className="mb-6 border-slate-200 bg-white p-6 shadow-sm rounded-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Register New Kiosk Vendor</h2>
            
            {registerSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800 shadow-sm">
                Vendor pre-registered successfully in Firestore!
              </div>
            )}
            {registerError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 shadow-sm">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Email</label>
                <Input
                  type="email"
                  required
                  placeholder="vendor@coreblock.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Machine ID</label>
                <Input
                  type="text"
                  required
                  placeholder="FP_MACHINE_02"
                  value={newMachineId}
                  onChange={(e) => setNewMachineId(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location Name</label>
                <Input
                  type="text"
                  required
                  placeholder="Bangalore, Electronic City"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cycle Price (INR)</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Razorpay Key ID (Optional)</label>
                <Input
                  type="text"
                  placeholder="rzp_live_..."
                  value={newKeyId}
                  onChange={(e) => setNewKeyId(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Razorpay Secret (Optional)</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newKeySecret}
                  onChange={(e) => setNewKeySecret(e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button
                  type="submit"
                  disabled={registeringVendor}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition-all"
                >
                  {registeringVendor ? 'Registering...' : 'Register Vendor & Kiosk'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TRANSACTION LOGS TABLE */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
          
          {/* Header Filter for Admin */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 gap-3">
            <h3 className="text-sm font-bold text-slate-700">Transaction Auditing</h3>
            {profile.role === 'admin' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Kiosk Filter:</span>
                <select
                  value={selectedMachineFilter}
                  onChange={(e) => setSelectedMachineFilter(e.target.value)}
                  className="border border-slate-300 bg-white text-slate-700 px-2 py-1 rounded text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Machines</option>
                  {allMachines.map(m => (
                    <option key={m.machineId} value={m.machineId}>
                      {m.machineId} - {m.location}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Date & Time</TableHead>
                  <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Machine ID</TableHead>
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
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                      Loading payment logs...
                    </TableCell>
                  </TableRow>
                ) : errorTransactions ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-600 font-medium">
                      Failed to fetch logs. Verify connection to backend API server.
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 font-medium">
                      No transaction records retrieved for this selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
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
                        <TableCell className="px-6 py-4 text-slate-700 font-semibold">{tx.machineId || 'Default'}</TableCell>
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
