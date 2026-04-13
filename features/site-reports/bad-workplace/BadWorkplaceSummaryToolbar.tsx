import operationalStyles from '@/components/site/OperationalReports.module.css';

interface BadWorkplaceSummaryToolbarProps {
  isGeneratingHwpx: boolean;
  isSaving: boolean;
  onDownloadHwpx: () => void;
  onSave: () => void;
  title: string;
}

export function BadWorkplaceSummaryToolbar({
  isGeneratingHwpx,
  isSaving,
  onDownloadHwpx,
  onSave,
  title,
}: BadWorkplaceSummaryToolbarProps) {
  return (
    <div className={operationalStyles.toolbar}>
      <div className={operationalStyles.toolbarHeading}>
        <div>
          <h1 className={operationalStyles.sectionTitle}>{title}</h1>
        </div>
      </div>
      <div className={operationalStyles.toolbarActions}>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={onDownloadHwpx}
          disabled={isGeneratingHwpx}
        >
          {isGeneratingHwpx ? 'HWPX 생성 중...' : '문서 다운로드 (.hwpx)'}
        </button>
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
