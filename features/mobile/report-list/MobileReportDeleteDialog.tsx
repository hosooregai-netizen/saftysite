'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '../components/MobileShell.module.css';

interface MobileReportDeleteDialogProps {
  deleteError: string | null;
  isDeletingReport: boolean;
  open: boolean;
  reportTitle: string | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function MobileReportDeleteDialog({
  deleteError,
  isDeletingReport,
  open,
  reportTitle,
  onClose,
  onSubmit,
}: MobileReportDeleteDialogProps) {
  return (
    <AppModal
      open={open}
      title="보고서 삭제"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-danger"
            onClick={onSubmit}
            disabled={isDeletingReport}
          >
            {isDeletingReport ? '삭제 중...' : '삭제'}
          </button>
        </>
      }
    >
      <div className={styles.filterRow}>
        <p className={styles.inlineNotice}>
          {reportTitle ? `"${reportTitle}" 보고서를 삭제합니다.` : '선택한 보고서를 삭제합니다.'}
        </p>
        {deleteError ? <p className={styles.errorNotice}>{deleteError}</p> : null}
      </div>
    </AppModal>
  );
}
