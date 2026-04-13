import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySourceReport } from './types';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';
import { getQuarterlySourceReportTitle } from './quarterlyReportHelpers';

export function QuarterlySourceSelectionSection(props: {
  periodStartDate: string;
  periodEndDate: string;
  selectedQuarter: string;
  sourceReports: QuarterlySourceReport[];
  error: string | null;
  loading: boolean;
  selectedSourceSet: Set<string>;
  hasPendingSelectionChanges: boolean;
  onChangePeriod: (field: 'periodStartDate' | 'periodEndDate', value: string) => void;
  onChangeQuarter: (value: string) => void;
  onOpenSelector: () => void;
  onRecalculate: () => Promise<boolean>;
}) {
  const {
    periodStartDate,
    periodEndDate,
    selectedQuarter,
    sourceReports,
    error,
    loading,
    selectedSourceSet,
    hasPendingSelectionChanges,
    onChangePeriod,
    onChangeQuarter,
    onOpenSelector,
    onRecalculate,
  } = props;
  const selectedReports = sourceReports.filter((report) =>
    selectedSourceSet.has(report.report_key),
  );
  const previewReports = selectedReports.slice(0, 3);

  return (
    <article className={operationalStyles.reportCard}>
      <QuarterlySectionHeader title="1. 원본 보고서 선택" />
      <div className={operationalStyles.periodFieldGrid}>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>분기</span>
          <select
            className={`app-select ${operationalStyles.periodQuarterSelect}`}
            value={selectedQuarter}
            onChange={(event) => onChangeQuarter(event.target.value)}
            aria-label="분기"
            disabled={loading}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>시작일</span>
          <input
            className="app-input"
            type="date"
            value={periodStartDate}
            onChange={(event) => onChangePeriod('periodStartDate', event.target.value)}
            disabled={loading}
          />
        </label>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>종료일</span>
          <input
            className="app-input"
            type="date"
            value={periodEndDate}
            onChange={(event) => onChangePeriod('periodEndDate', event.target.value)}
            disabled={loading}
          />
        </label>
      </div>

      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}

      {sourceReports.length > 0 ? (
        <div className={operationalStyles.inlineEditorRow}>
          {previewReports.length > 0 ? (
            <div className={operationalStyles.tagList}>
              {previewReports.map((report) => (
                <span key={report.report_key} className={operationalStyles.tag}>
                  {getQuarterlySourceReportTitle(report)}
                </span>
              ))}
              {selectedReports.length > previewReports.length ? (
                <span className={operationalStyles.tag}>
                  +{selectedReports.length - previewReports.length}건
                </span>
              ) : null}
            </div>
          ) : (
            <div className={operationalStyles.muted}>선택된 원본 보고서가 없습니다.</div>
          )}
          <div className={operationalStyles.inlineEditorActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={onOpenSelector}
              disabled={loading}
            >
              보고서 선택
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void onRecalculate()}
              disabled={!hasPendingSelectionChanges || loading}
            >
              다시 계산
            </button>
          </div>
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>
          {loading
            ? '해당 현장 원본 보고서를 불러오는 중입니다.'
            : '선택 가능한 원본 보고서가 없습니다.'}
        </div>
      )}
    </article>
  );
}
