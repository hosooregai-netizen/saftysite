import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';

export function QuarterlySummaryToolbar(props: {
  draft: QuarterlySummaryReport;
  isGeneratingDocument: boolean;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  onDownloadWord: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onOpenDocumentInfo: () => void;
  onOpenTitleEditor: () => void;
}) {
  const {
    draft,
    isGeneratingDocument,
    isGeneratingHwpx,
    isGeneratingPdf,
    onDownloadWord,
    onDownloadPdf,
    onOpenDocumentInfo,
    onOpenTitleEditor,
  } = props;

  return (
    <div className={operationalStyles.toolbar}>
      <div className={operationalStyles.toolbarHeading}>
        <div>
          <h1 className={operationalStyles.sectionTitle}>{draft.title}</h1>
        </div>
        <div className={operationalStyles.toolbarActions}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onOpenDocumentInfo}
          >
            문서 정보
          </button>
          <button
            type="button"
            className={operationalStyles.toolbarIconButton}
            onClick={onOpenTitleEditor}
            aria-label="보고서 제목 수정"
            title="보고서 제목 수정"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={operationalStyles.toolbarIcon}
            >
              <path
                d="M13.8 3.2a2 2 0 0 1 2.9 2.7l-.1.1-8 8a1 1 0 0 1-.5.3l-3 .7a.8.8 0 0 1-1-.9l.7-3a1 1 0 0 1 .2-.4l.1-.1 8-8Zm-7.7 8.6-.4 1.7 1.7-.4 7.7-7.7-1.3-1.3-7.7 7.7Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className={operationalStyles.toolbarActions}>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => void onDownloadWord()}
          disabled={isGeneratingDocument}
        >
          {isGeneratingHwpx ? 'HWPX 생성 중...' : '문서 다운로드 (.hwpx)'}
        </button>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => void onDownloadPdf()}
          disabled={isGeneratingDocument}
        >
          {isGeneratingPdf ? 'PDF 생성 중...' : '문서 다운로드 (.pdf)'}
        </button>
      </div>
    </div>
  );
}
