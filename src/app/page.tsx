'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated in the portal
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.replace('/portal/');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400 font-sans font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"></div>
          <span>Loading FreshPod...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
              <Image 
                src="/assets/logo-square.png" 
                alt="FreshPod Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              FreshPod
            </span>
          </div>
          <button 
            onClick={() => router.push('/portal/login')}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            Login to Portal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-8">
          <span>✨ Next-Gen Vending Solutions</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Dynamic SaaS Platform <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            For Smart Kiosks
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mb-10">
          FreshPod coordinates state-of-the-art telemetry, multi-tenant vendor allocations, and instant payment loops. Set up custom dispensing configurations, audit real-time transaction streams, and control your telemetry networks from a single, unified command center.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button 
            onClick={() => router.push('/portal/login')}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-base transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Open Admin Dashboard
          </button>
          <a
            href="https://www.coreblock.in"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 font-bold text-base text-slate-300 transition-all hover:text-white"
          >
            Learn More
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} FreshPod Technologies. Powered by CoreBlock.</p>
      </footer>
    </div>
  );
}
