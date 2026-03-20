'use client';

import { useState } from 'react';
import { createEmptyCausativeAgentMap } from '@/constants/siteOverview';
import type {
  CausativeAgentKey,
  CausativeAgentReport,
} from '@/types/siteOverview';
import ChecklistReasoningCard from './ChecklistReasoningCard';
import MobileChecklistList from './MobileChecklistList';
import SiteOverviewChecklistTable from './SiteOverviewChecklistTable';
import SiteOverviewUploadPanel from './SiteOverviewUploadPanel';
import styles from './SiteOverviewChecklist.module.css';

interface SiteOverviewChecklistProps {
  report: CausativeAgentReport | null;
  onAgentToggle: (key: CausativeAgentKey, checked: boolean) => void;
  onUploadSuccess: (report: CausativeAgentReport) => void;
  onUploadClear: () => void;
  onRawResponse?: (raw: unknown) => void;
}

function joinClassNames(...values: Array<string | false>) {
  return values.filter(Boolean).join(' ');
}

function createEmptyReport(): CausativeAgentReport {
  return {
    agents: createEmptyCausativeAgentMap(),
    reasoning: '',
    photoUrl: '',
  };
}

export default function SiteOverviewChecklist({
  report,
  onAgentToggle,
  onUploadSuccess,
  onUploadClear,
  onRawResponse,
}: SiteOverviewChecklistProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);

  const currentReport = report ?? createEmptyReport();
  const reasoning = currentReport.reasoning.trim();
  const contentShellClassName = joinClassNames(
    styles.contentShell,
    isAnalyzing && styles.contentShellAnalyzing
  );

  return (
    <section className={styles.section}>
      <div className={styles.contentFrame} aria-busy={isAnalyzing}>
        {isAnalyzing ? (
          <div className={styles.loadingOverlay} role="status" aria-live="polite">
            <div className={styles.loadingPanel}>
              <div className={styles.loadingSpinner} aria-hidden="true" />
              <p className={styles.loadingOverlayTitle}>환경 사진을 분석하고 있습니다.</p>
              <p className={styles.loadingDescription}>
                체크표와 분석 근거를 업데이트하는 동안 잠시만 기다려 주세요.
              </p>
            </div>
          </div>
        ) : null}

        <div className={contentShellClassName}>
          <div className={styles.stack}>
            <div className={styles.fieldBlock}>
              <div className={styles.fieldHeader}>
                <p className={styles.fieldLabel}>환경 사진</p>
              </div>
              <SiteOverviewUploadPanel
                report={currentReport}
                onSuccess={onUploadSuccess}
                onClear={onUploadClear}
                onRawResponse={onRawResponse}
                onLoadingChange={setIsAnalyzing}
              />
              {reasoning ? (
                <ChecklistReasoningCard
                  reasoning={reasoning}
                  expanded={expandedReasoning === reasoning}
                  onToggle={() =>
                    setExpandedReasoning((current) =>
                      current === reasoning ? null : reasoning
                    )
                  }
                />
              ) : null}
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.tableFrame}>
                <SiteOverviewChecklistTable
                  report={currentReport}
                  disabled={isAnalyzing}
                  onAgentToggle={onAgentToggle}
                />
                <MobileChecklistList
                  report={currentReport}
                  disabled={isAnalyzing}
                  onAgentToggle={onAgentToggle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
