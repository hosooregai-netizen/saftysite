'use client';

import AppModal from '@/components/ui/AppModal';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileBadWorkplaceSourceCard } from './MobileBadWorkplaceSourceCard';

interface MobileBadWorkplaceSourceModalProps {
  open: boolean;
  selectedSessionId: string | null;
  siteSessions: InspectionSession[];
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function MobileBadWorkplaceSourceModal({
  open,
  selectedSessionId,
  siteSessions,
  onClose,
  onSelectSession,
}: MobileBadWorkplaceSourceModalProps) {
  return (
    <AppModal
      open={open}
      title="원본 기술지도 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <button type="button" className="app-button app-button-secondary" onClick={onClose}>
          닫기
        </button>
      }
    >
      <div style={{ display: 'grid', gap: '10px' }}>
        {siteSessions.length > 0 ? (
          siteSessions.map((session) => {
            const isSelected = session.id === selectedSessionId;
            return (
              <MobileBadWorkplaceSourceCard
                key={session.id}
                session={session}
                actionDisabled={isSelected}
                actionLabel={isSelected ? '선택됨' : '불러오기'}
                onAction={() => onSelectSession(session.id)}
              />
            );
          })
        ) : (
          <div className={styles.mobileImplementationEmpty}>
            선택할 수 있는 기술지도 보고서가 없습니다.
          </div>
        )}
      </div>
    </AppModal>
  );
}
