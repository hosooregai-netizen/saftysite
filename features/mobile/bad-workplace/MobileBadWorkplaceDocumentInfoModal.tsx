'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSession } from '@/types/inspectionSession';
import {
  formatDateTimeLabel,
  formatMobileBadWorkplaceMonth,
  getSourceSessionDisplay,
} from './mobileBadWorkplaceHelpers';

interface MobileBadWorkplaceDocumentInfoModalProps {
  draft: BadWorkplaceReport;
  open: boolean;
  selectedSession: InspectionSession | null;
  onClose: () => void;
}

export function MobileBadWorkplaceDocumentInfoModal({
  draft,
  open,
  selectedSession,
  onClose,
}: MobileBadWorkplaceDocumentInfoModalProps) {
  return (
    <AppModal
      open={open}
      title="문서정보 확인"
      onClose={onClose}
      actions={
        <button type="button" className="app-button app-button-secondary" onClick={onClose}>
          닫기
        </button>
      }
    >
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>문서명</span>
          <span className={styles.infoValue}>{draft.title || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>신고월</span>
          <span className={styles.infoValue}>
            {formatMobileBadWorkplaceMonth(draft.reportMonth)}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>원본 보고서</span>
          <span className={styles.infoValue}>{getSourceSessionDisplay(selectedSession)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>작성자</span>
          <span className={styles.infoValue}>{draft.reporterName || '-'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>최종 수정</span>
          <span className={styles.infoValue}>{formatDateTimeLabel(draft.updatedAt)}</span>
        </div>
      </div>
    </AppModal>
  );
}
