'use client';

import type { InspectionSession } from '@/types/inspectionSession';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileBadWorkplaceSourceCard } from './MobileBadWorkplaceSourceCard';

interface MobileBadWorkplaceSourceSectionProps {
  onOpenSourceModal: () => void;
  selectedSession: InspectionSession | null;
  siteSessions: InspectionSession[];
}

export function MobileBadWorkplaceSourceSection({
  onOpenSourceModal,
  selectedSession,
  siteSessions,
}: MobileBadWorkplaceSourceSectionProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>1. 원본 보고서 선택</div>
        {siteSessions.length > 0 ? (
          <button
            type="button"
            className={`app-button app-button-primary ${styles.mobileImplementationAddButton}`}
            onClick={onOpenSourceModal}
          >
            보고서 선택
          </button>
        ) : null}
      </div>

      {selectedSession ? (
        <MobileBadWorkplaceSourceCard session={selectedSession} />
      ) : (
        <div className={styles.mobileImplementationEmpty}>
          원본으로 사용할 기술지도 보고서가 없습니다.
        </div>
      )}
    </section>
  );
}
