'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/portal/');
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
      Redirecting to admin panel...
    </div>
  );
}
