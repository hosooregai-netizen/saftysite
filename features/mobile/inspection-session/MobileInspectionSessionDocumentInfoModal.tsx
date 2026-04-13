'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionDocumentInfoModalProps {
  documentInfoOpen: boolean;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
  setDocumentInfoOpen: (open: boolean) => void;
}

export function MobileInspectionSessionDocumentInfoModal({
  documentInfoOpen,
  screen,
  session,
  setDocumentInfoOpen,
}: MobileInspectionSessionDocumentInfoModalProps) {
  return (
    <AppModal
      open={documentInfoOpen}
      title="문서정보 확인"
      onClose={() => setDocumentInfoOpen(false)}
      actions={
        <button type="button" className="app-button app-button-secondary" onClick={() => setDocumentInfoOpen(false)}>
          닫기
        </button>
      }
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>현장명</span>
          <input
            className="app-input"
            value={session.meta.siteName}
            placeholder="현장명"
            onChange={(event) => screen.changeMetaField('siteName', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>작성일</span>
          <input
            type="date"
            className="app-input"
            value={session.meta.reportDate}
            onChange={(event) => screen.changeMetaField('reportDate', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>담당</span>
          <input
            className="app-input"
            value={session.meta.drafter}
            placeholder="담당"
            onChange={(event) => screen.changeMetaField('drafter', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>검토</span>
          <input
            className="app-input"
            value={session.meta.reviewer}
            placeholder="검토"
            onChange={(event) => screen.changeMetaField('reviewer', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>확인</span>
          <input
            className="app-input"
            value={session.meta.approver}
            placeholder="확인"
            onChange={(event) => screen.changeMetaField('approver', event.target.value)}
          />
        </label>
      </div>
    </AppModal>
  );
}
