'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';

interface MobileQuarterlyDocumentInfoModalProps {
  draft: QuarterlySummaryReport;
  open: boolean;
  onChangeField: (field: 'drafter' | 'reviewer' | 'approver', value: string) => void;
  onClose: () => void;
}

export function MobileQuarterlyDocumentInfoModal({
  draft,
  open,
  onChangeField,
  onClose,
}: MobileQuarterlyDocumentInfoModalProps) {
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
      <div style={{ display: 'grid', gap: '12px' }}>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>작성자</span>
          <input
            className="app-input"
            value={draft.drafter}
            placeholder="작성자"
            onChange={(event) => onChangeField('drafter', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>검토자</span>
          <input
            className="app-input"
            value={draft.reviewer}
            placeholder="검토자"
            onChange={(event) => onChangeField('reviewer', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>승인자</span>
          <input
            className="app-input"
            value={draft.approver}
            placeholder="승인자"
            onChange={(event) => onChangeField('approver', event.target.value)}
          />
        </label>
      </div>
    </AppModal>
  );
}
