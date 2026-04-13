'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';

interface MobileInspectionSessionSummaryBarProps {
  hasLoadedSessionPayload: boolean;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  isSaving: boolean;
  onGenerateHwpx: () => void;
  onGeneratePdf: () => void;
  onOpenDocumentInfo: () => void;
  onSave: () => void;
  progressPercentage: number;
}

export function MobileInspectionSessionSummaryBar({
  hasLoadedSessionPayload,
  isGeneratingHwpx,
  isGeneratingPdf,
  isSaving,
  onGenerateHwpx,
  onGeneratePdf,
  onOpenDocumentInfo,
  onSave,
  progressPercentage,
}: MobileInspectionSessionSummaryBarProps) {
  return (
    <section
      className={`${styles.sectionCard} ${styles.mobileSummarySection}`}
      style={{ marginBottom: 0, borderRadius: '0 0 8px 8px', borderBottom: 'none', flexShrink: 0 }}
    >
      <div
        className={`${styles.statGrid} ${hasLoadedSessionPayload ? styles.mobileInspectionSummaryGrid : ''}`}
      >
        <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
          <span className={`${styles.statLabel} ${styles.mobileSummaryLabel}`}>진행률</span>
          <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>
            {progressPercentage}%
          </strong>
        </article>
        {hasLoadedSessionPayload ? (
          <button
            type="button"
            className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
            onClick={onOpenDocumentInfo}
          >
            문서정보
          </button>
        ) : null}
        {hasLoadedSessionPayload ? (
          <div className={styles.mobileSummaryExportStack} style={{ minWidth: 0 }}>
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
              disabled={isGeneratingHwpx || isGeneratingPdf}
              onClick={onGenerateHwpx}
            >
              {isGeneratingHwpx ? '한글...' : '한글'}
            </button>
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
              disabled={isGeneratingHwpx || isGeneratingPdf}
              onClick={onGeneratePdf}
            >
              {isGeneratingPdf ? 'PDF...' : 'PDF'}
            </button>
          </div>
        ) : null}
        {hasLoadedSessionPayload ? (
          <button
            type="button"
            className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
            disabled={isSaving || isGeneratingHwpx || isGeneratingPdf}
            onClick={onSave}
          >
            {isSaving ? '저장 중' : '저장'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
