'use client';

import AppModal from '@/components/ui/AppModal';

interface QuarterlyReportDeleteDialogProps {
  canArchiveReports: boolean;
  isSaving: boolean;
  open: boolean;
  reportTitle: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function QuarterlyReportDeleteDialog({
  canArchiveReports,
  isSaving,
  open,
  reportTitle,
  onClose,
  onConfirm,
}: QuarterlyReportDeleteDialogProps) {
  return (
    <AppModal
      open={canArchiveReports && open}
      title="분기 종합 보고서 삭제"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-danger"
            disabled={isSaving || !open}
            onClick={onConfirm}
          >
            삭제
          </button>
        </>
      }
    >
      <p>{reportTitle ? `"${reportTitle}" 보고서를 삭제합니다.` : '선택한 분기 종합 보고서를 삭제합니다.'}</p>
    </AppModal>
  );
}
