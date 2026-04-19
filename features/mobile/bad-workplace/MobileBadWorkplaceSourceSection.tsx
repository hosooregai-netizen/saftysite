'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { InspectionSession } from '@/types/inspectionSession';
import { MobileBadWorkplaceSourceCard } from './MobileBadWorkplaceSourceCard';

interface MobileBadWorkplaceSourceSectionProps {
  onOpenSourceModal: () => void;
  onReloadViolations: () => void;
  selectedSession: InspectionSession | null;
  siteSessions: InspectionSession[];
}

export function MobileBadWorkplaceSourceSection({
  onOpenSourceModal,
  onReloadViolations,
  selectedSession,
  siteSessions,
}: MobileBadWorkplaceSourceSectionProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>1. 원본 보고서 선택</div>
      </div>

      {siteSessions.length > 0 ? (
        <div className={styles.mobileInlineActions}>
          <button
            type="button"
            className={`app-button app-button-secondary ${styles.mobileInlineAction}`}
            onClick={onReloadViolations}
          >
            기본 항목 다시 불러오기
          </button>
          <button
            type="button"
            className={`app-button app-button-primary ${styles.mobileInlineAction}`}
            onClick={onOpenSourceModal}
          >
            보고서 선택
          </button>
        </div>
      ) : null}

      {selectedSession ? (
        <>
          <MobileBadWorkplaceSourceCard session={selectedSession} />
          <div className={styles.editorMeta}>
            선택한 기술지도 보고서의 이전 미이행과 당회차 신규 위험을 함께 불러옵니다.
          </div>
        </>
      ) : (
        <div className={styles.mobileImplementationEmpty}>
          원본으로 사용할 기술지도 보고서가 아직 없습니다.
        </div>
      )}
    </section>
  );
}
