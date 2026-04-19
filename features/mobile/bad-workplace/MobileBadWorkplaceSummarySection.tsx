'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { BadWorkplaceReport } from '@/types/erpReports';
import { formatMobileBadWorkplaceMonth } from './mobileBadWorkplaceHelpers';

interface MobileBadWorkplaceSummarySectionProps {
  draft: BadWorkplaceReport;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  isSaving: boolean;
  onDownloadHwpx: () => void;
  onDownloadPdf: () => void;
  onOpenDocumentInfo: () => void;
  onSave: () => void;
}

export function MobileBadWorkplaceSummarySection({
  draft,
  isGeneratingHwpx,
  isGeneratingPdf,
  isSaving,
  onDownloadHwpx,
  onDownloadPdf,
  onOpenDocumentInfo,
  onSave,
}: MobileBadWorkplaceSummarySectionProps) {
  return (
    <section
      className={`${styles.sectionCard} ${styles.mobileSummarySection}`}
      style={{
        marginBottom: 0,
        borderRadius: '0 0 8px 8px',
        borderBottom: 'none',
        flexShrink: 0,
      }}
    >
      <div className={`${styles.statGrid} ${styles.mobileSummaryGrid}`}>
        <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
          <span className={`${styles.statLabel} ${styles.mobileSummaryLabel}`}>신고월</span>
          <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>
            {formatMobileBadWorkplaceMonth(draft.reportMonth)}
          </strong>
        </article>
        <div className={styles.mobileSummaryActionStack}>
          <button
            type="button"
            className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
            onClick={onOpenDocumentInfo}
          >
            문서정보
          </button>
          <div className={styles.mobileSummaryExportStack}>
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
              disabled={isGeneratingHwpx || isGeneratingPdf}
              onClick={onDownloadHwpx}
            >
              {isGeneratingHwpx ? 'HWPX...' : 'HWPX'}
            </button>
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
              disabled={isGeneratingHwpx || isGeneratingPdf}
              onClick={onDownloadPdf}
            >
              {isGeneratingPdf ? 'PDF...' : 'PDF'}
            </button>
          </div>
        </div>
        <button
          type="button"
          className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
          disabled={isSaving || isGeneratingHwpx || isGeneratingPdf}
          onClick={onSave}
        >
          {isSaving ? '저장 중' : '저장'}
        </button>
      </div>
    </section>
  );
}
