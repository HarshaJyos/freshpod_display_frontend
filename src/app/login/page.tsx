'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Authentication failure:', err);
      const errCode = err.code || '';
      if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password') {
        // Try placeholder verification
        try {
          const emailClean = email.toLowerCase().trim();
          const placeholderRef = doc(db, 'users', emailClean);
          const placeholderSnap = await getDoc(placeholderRef);
          
          if (placeholderSnap.exists() && placeholderSnap.data().passcode === password) {
            // Auto register vendor in Firebase Auth using client SDK
            const authUserCredential = await createUserWithEmailAndPassword(auth, emailClean, password);
            const user = authUserCredential.user;
            
            // Write linked user doc
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
              email: emailClean,
              role: 'vendor',
              machineId: placeholderSnap.data().machineId || '',
              location: placeholderSnap.data().location || '',
              passcode: placeholderSnap.data().passcode,
              createdAt: Date.now()
            });
            
            // Delete placeholder doc
            await deleteDoc(placeholderRef);
            
            // Success redirect
            router.push('/dashboard');
            return;
          }
        } catch (linkErr) {
          console.error('Failed to link placeholder account:', linkErr);
        }
        
        setError('Invalid email or password.');
      } else {
        setError('Connection failure. Check your network.');
      }
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
        Loading Auth Server...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm rounded-xl">
        <CardHeader className="space-y-1.5 pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 text-center">
            FreshPod Admin Console
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm text-center font-normal">
            Log in to manage configurations and view transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                required
                className="w-full border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                placeholder="admin@coreblock.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                className="w-full border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
