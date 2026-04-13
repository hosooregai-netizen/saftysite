'use client';

import styles from '@/features/mobile/components/MobileShell.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { MobileQuarterlySourceReport } from './types';

interface MobileQuarterlyOverviewStepProps {
  draft: QuarterlySummaryReport;
  isSourceLoading: boolean;
  selectedQuarter: string;
  selectedSourceKeys: string[];
  sourceNotice: string | null;
  sourceReports: MobileQuarterlySourceReport[];
  onApplySourceSelection: () => void;
  onChangeTitle: (value: string) => void;
  onOpenSourceModal: () => void;
  onPeriodFieldChange: (key: 'periodStartDate' | 'periodEndDate', value: string) => void;
  onQuarterChange: (value: string) => void;
}

export function MobileQuarterlyOverviewStep({
  draft,
  isSourceLoading,
  selectedQuarter,
  selectedSourceKeys,
  sourceNotice,
  sourceReports,
  onApplySourceSelection,
  onChangeTitle,
  onOpenSourceModal,
  onPeriodFieldChange,
  onQuarterChange,
}: MobileQuarterlyOverviewStepProps) {
  const selectedSourceSet = new Set(selectedSourceKeys);

  return (
    <section className={styles.mobileEditorCard}>
      <input className="app-input" value={draft.title} onChange={(event) => onChangeTitle(event.target.value)} />
      <div className={styles.mobileOverviewPeriodRow}>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>분기</span>
          <select className="app-select" value={selectedQuarter} onChange={(event) => onQuarterChange(event.target.value)}>
            <option value="1">1분기</option>
            <option value="2">2분기</option>
            <option value="3">3분기</option>
            <option value="4">4분기</option>
          </select>
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>시작일</span>
          <input
            type="date"
            className="app-input"
            value={draft.periodStartDate}
            onChange={(event) => onPeriodFieldChange('periodStartDate', event.target.value)}
          />
        </label>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>종료일</span>
          <input
            type="date"
            className="app-input"
            value={draft.periodEndDate}
            onChange={(event) => onPeriodFieldChange('periodEndDate', event.target.value)}
          />
        </label>
      </div>
      <div className={styles.mobileInlineActions}>
        <button
          type="button"
          className={`app-button app-button-primary ${styles.mobileInlineAction}`}
          onClick={onOpenSourceModal}
        >
          보고서 선택
        </button>
        <button
          type="button"
          className={`app-button app-button-secondary ${styles.mobileInlineAction}`}
          onClick={onApplySourceSelection}
          disabled={isSourceLoading}
        >
          {isSourceLoading ? '반영 중...' : '재 반영'}
        </button>
      </div>
      {sourceNotice ? <div className={styles.inlineNotice}>{sourceNotice}</div> : null}
      <div style={{ display: 'grid', gap: '10px' }}>
        {sourceReports
          .filter((report) => selectedSourceSet.has(report.report_key))
          .map((report) => (
            <article key={report.report_key} className={styles.reportCard} style={{ padding: '12px' }}>
              <strong>{report.report_title || report.guidance_date || report.report_key}</strong>
              <div style={{ color: '#475569', display: 'flex', flexWrap: 'wrap', fontSize: '13px', gap: '10px' }}>
                <span>{report.guidance_date || '-'}</span>
                <span>지적 {report.finding_count}건</span>
                <span>개선 {report.improved_count}건</span>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
