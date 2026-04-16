'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { ControllerReportRow } from '@/types/admin';

export interface OriginalPdfDialogState {
  error: string | null;
  loading: boolean;
  pdfUrl: string | null;
  reason: string | null;
  row: ControllerReportRow | null;
}

interface ReportsOriginalPdfDialogProps {
  dialog: OriginalPdfDialogState;
  onClose: () => void;
  onRetry: (row: ControllerReportRow) => void;
}

export function ReportsOriginalPdfDialog({
  dialog,
  onClose,
  onRetry,
}: ReportsOriginalPdfDialogProps) {
  const row = dialog.row;
  const title = row?.reportTitle || row?.periodLabel || row?.reportKey || '원본 PDF';
  const viewerUrl = dialog.pdfUrl ? `${dialog.pdfUrl}#toolbar=0&navpanes=0` : '';

  return (
    <AppModal
      open={Boolean(row)}
      title="원본 PDF 보기"
      onClose={onClose}
      closeOnBackdrop={false}
      size="large"
      actions={
        <>
          {row && dialog.error ? (
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => onRetry(row)}
            >
              다시 시도
            </button>
          ) : null}
          <button type="button" className="app-button app-button-primary" onClick={onClose}>
            닫기
          </button>
        </>
      }
    >
      <div className={styles.sectionBody}>
        <div>
          <div className={styles.tablePrimary}>{title}</div>
          <div className={styles.tableSecondary}>
            {dialog.reason || '원본 PDF를 서비스 안에서 열고 있습니다.'}
          </div>
        </div>
        {dialog.loading ? (
          <div className={styles.tableEmpty}>원본 PDF를 불러오는 중입니다.</div>
        ) : null}
        {dialog.error ? <div className={styles.bannerError}>{dialog.error}</div> : null}
        {viewerUrl && !dialog.error ? (
          <div
            style={{
              border: '1px solid var(--erp-line)',
              borderRadius: 8,
              height: 'min(72dvh, 760px)',
              minHeight: 420,
              overflow: 'hidden',
            }}
          >
            <iframe
              src={viewerUrl}
              title={`${title} 원본 PDF`}
              style={{
                border: 0,
                height: '100%',
                width: '100%',
              }}
            />
          </div>
        ) : null}
      </div>
    </AppModal>
  );
}
