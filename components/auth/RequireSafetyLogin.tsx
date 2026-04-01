'use client';

import type { ReactNode } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { LoadingStatePanel } from '@/components/session/workspace/WorkspaceStatePanels';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';

interface RequireSafetyLoginProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function RequireSafetyLogin({
  children,
  title,
  description,
}: RequireSafetyLoginProps) {
  const { authError, isAuthenticated, isHydrating, isReady, login } =
    useInspectionSessions();

  if (!isReady) {
    return <LoadingStatePanel />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        busy={isHydrating}
        error={authError}
        onSubmit={login}
        title={title}
        description={description}
      />
    );
  }

  return <>{children}</>;
}
