'use client';

import type { ReactNode } from 'react';
import { WorkerShellSidebarProvider } from '@/components/worker/WorkerShellSidebarContext';
import { InspectionSessionsProvider } from '@/hooks/useInspectionSessions';

export default function AppProviders({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <InspectionSessionsProvider>
      <WorkerShellSidebarProvider>{children}</WorkerShellSidebarProvider>
    </InspectionSessionsProvider>
  );
}
