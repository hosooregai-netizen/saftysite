'use client';

import type { ReactNode } from 'react';
import { useWorkerShellSidebar } from '@/components/worker/WorkerShellSidebarContext';
import layoutStyles from '@/components/worker/WorkerShellLayout.module.css';

export default function WorkerShellBody({
  children,
  gradientBg = true,
}: {
  children: ReactNode;
  gradientBg?: boolean;
}) {
  const { collapsed } = useWorkerShellSidebar();

  return (
    <div
      className={[
        layoutStyles.workerShellBody,
        collapsed ? layoutStyles.workerShellBodyCollapsed : '',
        gradientBg ? layoutStyles.workerShellBodyGradient : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

