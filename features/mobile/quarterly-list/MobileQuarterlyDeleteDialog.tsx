'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';

interface MobileQuarterlyDeleteDialogProps {
  deleteError: string | null;
  isDeletingReport: boolean;
  open: boolean;
  reportTitle: string | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function MobileQuarterlyDeleteDialog({
  deleteError,
  isDeletingReport,
  open,
  reportTitle,
  onClose,
  onSubmit,
}: MobileQuarterlyDeleteDialogProps) {
  return (
    <AppModal
      open={open}
      title="분기 보고 삭제"
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
      <div style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {reportTitle ? `"${reportTitle}" 보고서를 삭제할까요?` : '선택한 보고서를 삭제할까요?'}
        </p>
        {deleteError ? <div className={styles.errorNotice}>{deleteError}</div> : null}
      </div>
    </AppModal>
  );
}
