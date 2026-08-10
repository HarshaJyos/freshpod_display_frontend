'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, limit, deleteDoc } from 'firebase/firestore';
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
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  // Admin registration form states
  const [newEmail, setNewEmail] = useState('');
  const [newMachineId, setNewMachineId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newAmount, setNewAmount] = useState('50');
  const [newKeyId, setNewKeyId] = useState('');
  const [newKeySecret, setNewKeySecret] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [registeringVendor, setRegisteringVendor] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Transactions logs states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [errorTransactions, setErrorTransactions] = useState(false);

  // Admin aggregated stats
  const [allMachines, setAllMachines] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [deletingVendorId, setDeletingVendorId] = useState<string>('');
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

  // Authenticate and synchronize session profile directly on the client side
  const syncUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      let data: UserProfile | null = null;

      if (userSnap.exists()) {
        data = userSnap.data() as UserProfile;
      } else {
        // Check if there are any other users. If not, make them admin
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
        if (usersSnap.empty) {
          const email = user.email?.toLowerCase().trim() || '';
          data = {
            email,
            role: 'admin'
          };
          await setDoc(userDocRef, {
            ...data,
            createdAt: Date.now()
          });
          console.log(`[CLIENT AUTH] Bootstrapped first user ${email} as admin.`);
        }
      }

      if (!data) {
        throw new Error('No user profile found.');
      }

      setProfile(data);
      setCheckingAuth(false);

      if (data.role === 'vendor' && data.machineId) {
        setMachineId(data.machineId);
        setLocation(data.location || '');
        await loadMachineConfig(data.machineId);
        await loadTransactions(data);
      } else if (data.role === 'admin') {
        await loadAdminMachines();
        await loadAdminVendors();
        await loadTransactions(data);
      }
    } catch (err) {
      console.error('Failed to sync profile client-side:', err);
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
        const configData = docSnap.data();
        setAmount(configData.amount?.toString() || '50');
        setRazorpayKeyId(configData.razorpayKeyId || '');
        setRazorpayKeySecret(configData.razorpayKeySecret || '');
      } else {
        setAmount('50');
        setRazorpayKeyId('');
        setRazorpayKeySecret('');
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

  // Admin: Load all vendors from user profile collections
  const loadAdminVendors = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.role === 'vendor') {
          list.push({
            id: docSnap.id,
            email: data.email || docSnap.id,
            machineId: data.machineId || '',
            location: data.location || 'Not Set',
            createdAt: data.createdAt || 0
          });
        }
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      setAllVendors(list);
    } catch (err) {
      console.error('Failed to load vendors list:', err);
    }
  };

  // Admin: Delete vendor and their linked machine configs
  const handleDeleteVendor = async (vendorDocId: string, mId: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${vendorDocId}"? This will also remove the kiosk "${mId || 'N/A'}".`)) {
      return;
    }

    try {
      setDeletingVendorId(vendorDocId);

      let headers = {};
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers = { 
          'Authorization': `Bearer ${token}`
        };
      }

      const res = await fetch(`${backendUrl}/api/admin/delete-vendor/${vendorDocId}?machineId=${mId}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete vendor');
      }

      alert('Vendor and Kiosk configuration deleted successfully!');
      await loadAdminMachines();
      await loadAdminVendors();
    } catch (err: any) {
      console.error('Failed to delete vendor:', err);
      alert(err.message || 'Failed to delete vendor. Permission denied.');
    } finally {
      setDeletingVendorId('');
    }
  };

  // Load Transactions logs via public Next.js API
  const loadTransactions = async (userProfile?: UserProfile) => {
    try {
      setErrorTransactions(false);
      setLoadingTransactions(true);
      
      const currentProfile = userProfile || profile;
      if (!currentProfile) return;

      let headers = {};
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers = { 'Authorization': `Bearer ${token}` };
      }

      if (currentProfile.role === 'admin') {
        const res = await fetch(`${backendUrl}/api/payments/all?machineId=all`, { headers });
        if (!res.ok) throw new Error('API server error');
        const data = await res.json();
        setTransactions(data);
      } else {
        const mId = currentProfile.machineId;
        if (!mId) {
          setTransactions([]);
          return;
        }
        const res = await fetch(`${backendUrl}/api/payments/all?machineId=${mId}`, { headers });
        if (!res.ok) throw new Error('API server error');
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions list:', err);
      setErrorTransactions(true);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Vendor: Update specific machine config in Firestore
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
        location: location,
        razorpayKeyId: razorpayKeyId || '',
        razorpayKeySecret: razorpayKeySecret || '',
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

  // Admin: Register a new vendor and their credentials directly on Express backend
  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);
    setRegisteringVendor(true);

    try {
      if (!newEmail || !newPassword || !newMachineId || !newLocation || !newAmount) {
        throw new Error('Missing required configuration fields');
      }

      const formattedEmail = newEmail.toLowerCase().trim();

      let headers = {};
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }

      const res = await fetch(`${backendUrl}/api/admin/create-vendor`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: formattedEmail,
          password: newPassword,
          machineId: newMachineId,
          location: newLocation,
          amount: Number(newAmount),
          razorpayKeyId: newKeyId,
          razorpayKeySecret: newKeySecret
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || 'Failed to register vendor');
      }

      setRegisterSuccess(true);
      setNewEmail('');
      setNewPassword('');
      setNewMachineId('');
      setNewLocation('');
      setNewAmount('50');
      setNewKeyId('');
      setNewKeySecret('');
      
      await loadAdminMachines(); // Refresh lists
      await loadAdminVendors();
    } catch (err: any) {
      console.error('Registration failed:', err);
      setRegisterError(err.message || 'Failed to complete registration.');
    } finally {
      setRegisteringVendor(false);
    }
  };

  const handleExportCSV = () => {
    let csv = 'Payment ID,Machine ID,Date,Amount (INR),Method,Status,Customer Email,Customer Contact\n';
    filteredTransactions.forEach((p: any) => {
      const date = new Date(p.created_at * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const amount = (p.amount / 100).toFixed(2);
      const email = p.email || 'N/A';
      const contact = p.contact || 'N/A';
      const mId = p.machineId || 'N/A';
      csv += `"${p.id}","${mId}","${date}",${amount},"${p.method}","${p.status}","${email}","${contact}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "freshpod_payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <Button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              Export to CSV (Excel)
            </Button>
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
            <h2 className="text-lg font-bold text-slate-900 mb-2">Kiosk Configuration & Settings</h2>
            <p className="text-slate-500 text-xs mb-4">
              Machine ID: <span className="font-semibold text-slate-700">{machineId}</span> | Current Location: <span className="font-semibold text-slate-700">{location}</span>
            </p>
            
            {priceSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800 shadow-sm">
                Kiosk settings updated successfully in Firestore!
              </div>
            )}

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="price" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Payment Cycle Price (INR)
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-500 font-bold text-lg">₹</span>
                    <Input
                      id="price"
                      type="number"
                      required
                      min="1"
                      className="border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      disabled={updatingPrice}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="location" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kiosk Location
                  </label>
                  <Input
                    id="location"
                    type="text"
                    required
                    className="border-slate-350 rounded-md mt-1 focus:border-blue-500 focus:ring-blue-500"
                    disabled={updatingPrice}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="keyId" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Razorpay Key ID
                  </label>
                  <Input
                    id="keyId"
                    type="text"
                    placeholder="rzp_live_..."
                    className="border-slate-350 rounded-md mt-1 focus:border-blue-500 focus:ring-blue-500"
                    disabled={updatingPrice}
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="keySecret" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Razorpay Key Secret
                  </label>
                  <Input
                    id="keySecret"
                    type="password"
                    placeholder="••••••••"
                    className="border-slate-350 rounded-md mt-1 focus:border-blue-500 focus:ring-blue-500"
                    disabled={updatingPrice}
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  disabled={updatingPrice}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition-all"
                >
                  {updatingPrice ? 'Updating settings...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ADMIN CONTROL PANEL: Pre-register Vendors */}
        {profile.role === 'admin' && (
          <div className="space-y-6">
            
            <Card className="border-slate-200 bg-white p-6 shadow-sm rounded-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Register New Kiosk Vendor</h2>
              
              {registerSuccess && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800 shadow-sm">
                  Vendor and Kiosk registered successfully!
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

            {/* List of registered Kiosks & Vendors */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700">Registered Vendors & Kiosks</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Vendor Email</TableHead>
                      <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Machine ID</TableHead>
                      <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4">Location</TableHead>
                      <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs px-6 py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                          No registered vendors. Create one using the form above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      allVendors.map((vendor) => (
                        <TableRow key={vendor.id} className="hover:bg-slate-50/75 border-slate-100 transition-colors">
                          <TableCell className="px-6 py-4 font-semibold text-slate-800">{vendor.email}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-700 font-mono text-xs">{vendor.machineId}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-600">{vendor.location}</TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              onClick={() => handleDeleteVendor(vendor.id, vendor.machineId)}
                              disabled={deletingVendorId === vendor.id}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1 text-xs rounded-md shadow-none hover:shadow-none hover:text-red-700"
                            >
                              {deletingVendorId === vendor.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
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
