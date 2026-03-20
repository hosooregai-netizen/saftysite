'use client';

import type { ReactNode } from 'react';
import { InspectionSessionsProvider } from '@/hooks/useInspectionSessions';

export default function AppProviders({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <InspectionSessionsProvider>{children}</InspectionSessionsProvider>;
}
