'use client';

import AppModal from '@/components/ui/AppModal';
import type { InspectionReportListItem } from '@/types/inspectionSession';

interface SiteReportDeleteDialogProps {
  canArchiveReports: boolean;
  deletingSession: InspectionReportListItem | null;
  isDeleting?: boolean;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function SiteReportDeleteDialog({
  canArchiveReports,
  deletingSession,
  isDeleting = false,
  open,
  onClose,
  onConfirm,
}: SiteReportDeleteDialogProps) {
  return (
    <AppModal
      open={canArchiveReports && open}
      title="보고서 삭제"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose} disabled={isDeleting}>
            취소
          </button>
          <button type="button" className="app-button app-button-danger" onClick={onConfirm} disabled={isDeleting}>
            삭제
          </button>
        </>
      }
    >
      <p>
        {deletingSession
          ? `"${deletingSession.reportTitle}" 보고서를 삭제합니다.`
          : '선택한 보고서를 삭제합니다.'}
      </p>
    </AppModal>
  );
}
