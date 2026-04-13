'use client';

import type { ReactNode } from 'react';
import styles from '@/features/mobile/components/MobileShell.module.css';
import tabStyles from '@/features/mobile/components/MobileStepTabs.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { getMobileQuarterLabel } from './mobileQuarterlyReportHelpers';
import { MOBILE_QUARTERLY_STEPS, type MobileQuarterlyStepId } from './types';

interface MobileQuarterlySummarySectionProps {
  activeStep: MobileQuarterlyStepId;
  children: ReactNode;
  draft: QuarterlySummaryReport;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  isSaving: boolean;
  onDownloadHwpx: () => void;
  onDownloadPdf: () => void;
  onOpenDocumentInfo: () => void;
  onSave: () => void;
  onStepChange: (step: MobileQuarterlyStepId) => void;
}

export function MobileQuarterlySummarySection({
  activeStep,
  children,
  draft,
  isGeneratingHwpx,
  isGeneratingPdf,
  isSaving,
  onDownloadHwpx,
  onDownloadPdf,
  onOpenDocumentInfo,
  onSave,
  onStepChange,
}: MobileQuarterlySummarySectionProps) {
  return (
    <>
      <section
        className={`${styles.sectionCard} ${styles.mobileSummarySection}`}
        style={{ marginBottom: 0, borderRadius: '0 0 8px 8px', borderBottom: 'none', flexShrink: 0 }}
      >
        <div className={`${styles.statGrid} ${styles.mobileSummaryGrid}`}>
          <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
            <span className={`${styles.statLabel} ${styles.mobileSummaryLabel}`}>분기</span>
            <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>
              {getMobileQuarterLabel(draft)}
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
                {isGeneratingHwpx ? '한글...' : '한글'}
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

      <div className={tabStyles.layoutWrapper}>
        <div className={tabStyles.tabContainer}>
          {MOBILE_QUARTERLY_STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              className={`${tabStyles.tabButton} ${activeStep === step.id ? tabStyles.tabButtonActive : ''}`}
              onClick={() => onStepChange(step.id)}
            >
              {step.label}
            </button>
          ))}
        </div>
        <div className={tabStyles.stepContent}>{children}</div>
      </div>
    </>
  );
}
