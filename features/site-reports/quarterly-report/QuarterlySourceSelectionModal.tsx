import Link from 'next/link';
import AppModal from '@/components/ui/AppModal';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySourceReport } from './types';
import { getQuarterlySourceReportTitle } from './quarterlyReportHelpers';

export function QuarterlySourceSelectionModal(props: {
  open: boolean;
  sourceReports: QuarterlySourceReport[];
  error: string | null;
  loading: boolean;
  selectedSourceSet: Set<string>;
  selectedSourceReportKeys: string[];
  hasPendingSelectionChanges: boolean;
  onClose: () => void;
  onToggleSourceReport: (reportKey: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRecalculate: () => Promise<void>;
}) {
  const {
    open,
    sourceReports,
    error,
    loading,
    selectedSourceSet,
    selectedSourceReportKeys,
    hasPendingSelectionChanges,
    onClose,
    onToggleSourceReport,
    onSelectAll,
    onClearSelection,
    onRecalculate,
  } = props;

  return (
    <AppModal
      open={open}
      title="원본 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onSelectAll}
            disabled={loading}
          >
            전체 선택
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClearSelection}
            disabled={loading}
          >
            선택 해제
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => void onRecalculate()}
            disabled={!hasPendingSelectionChanges || loading}
          >
            다시 계산
          </button>
        </>
      }
    >
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {selectedSourceReportKeys.length === 0 ? (
        <div className={operationalStyles.bannerInfo}>선택된 원본 보고서가 없습니다.</div>
      ) : null}
      {sourceReports.length > 0 ? (
        <div className={operationalStyles.sourceModalList}>
          {sourceReports.map((report) => {
            const isSelected = selectedSourceSet.has(report.report_key);

            return (
              <article
                key={report.report_key}
                className={`${operationalStyles.sourceModalRow} ${
                  isSelected ? operationalStyles.sourceModalRowActive : ''
                }`}
              >
                <label className={operationalStyles.sourceModalRowMain}>
                  <input
                    type="checkbox"
                    className={`app-checkbox ${operationalStyles.sourceCheckbox}`}
                    checked={isSelected}
                    disabled={loading}
                    onChange={(event) =>
                      onToggleSourceReport(report.report_key, event.target.checked)
                    }
                  />
                  <div className={operationalStyles.sourceCardBody}>
                    <strong className={operationalStyles.sourceCardTitle}>
                      {getQuarterlySourceReportTitle(report)}
                    </strong>
                    <span className={operationalStyles.sourceCardMeta}>
                      지도일 {report.guidance_date || '-'} / 작성자 {report.drafter || '-'} /
                      진행률 {report.progress_rate || '-'} / 지적사항 {report.finding_count}건 /
                      개선 {report.improved_count}건
                    </span>
                  </div>
                </label>
                <div className={operationalStyles.sourceModalRowActions}>
                  <span className="app-chip">{isSelected ? '선택됨' : '미선택'}</span>
                  <Link
                    href={`/sessions/${encodeURIComponent(report.report_key)}`}
                    className={`${operationalStyles.linkButton} ${operationalStyles.linkButtonSecondary}`}
                  >
                    원본 보기
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>
          {loading
            ? '해당 현장 원본 보고서를 불러오는 중입니다.'
            : '선택 가능한 원본 보고서가 없습니다.'}
        </div>
      )}
    </AppModal>
  );
}
