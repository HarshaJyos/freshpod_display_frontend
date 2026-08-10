'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const PortalApp = dynamic(() => import('@/components/PortalApp'), { ssr: false });

export default function PortalPage() {
  return <PortalApp />;
}
