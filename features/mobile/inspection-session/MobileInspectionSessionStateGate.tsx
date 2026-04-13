'use client';

import type { ReactNode } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { buildMobileHomeHref } from '@/features/home/lib/siteEntry';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { MobileInspectionSessionStandaloneState } from './MobileInspectionSessionStandaloneState';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;

interface MobileInspectionSessionStateGateProps {
  children: ReactNode;
  screen: InspectionScreenController;
}

export function MobileInspectionSessionStateGate({
  children,
  screen,
}: MobileInspectionSessionStateGateProps) {
  if (!screen.isReady) {
    return <MobileInspectionSessionStandaloneState title="보고서를 준비하는 중입니다." />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="모바일 보고서 로그인"
        description="핵심 섹션 중심으로 기술지도 보고서를 이어서 작성합니다."
      />
    );
  }

  if (screen.isLoadingSession && !screen.displaySession) {
    return <MobileInspectionSessionStandaloneState title="보고서를 불러오는 중입니다." />;
  }

  if (!screen.displaySession || !screen.displayProgress) {
    return (
      <MobileInspectionSessionStandaloneState
        title="보고서를 찾을 수 없습니다."
        description="보고서가 아직 동기화되지 않았거나 접근 가능한 범위를 벗어났습니다."
        action={
          <a href={buildMobileHomeHref()} className="app-button app-button-secondary">
            현장 목록으로 돌아가기
          </a>
        }
      />
    );
  }

  return <>{children}</>;
}
