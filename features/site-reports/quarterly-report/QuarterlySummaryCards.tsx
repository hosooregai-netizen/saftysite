import operationalStyles from '@/components/site/OperationalReports.module.css';
import { formatPeriodRangeLabel } from '@/lib/erpReports/shared';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { formatDateTimeLabel } from './quarterlyReportHelpers';

export function QuarterlySummaryCards(props: {
  draft: QuarterlySummaryReport;
  error: string | null;
  documentError: string | null;
  notice: string | null;
}) {
  const { draft, error, documentError, notice } = props;

  return (
    <>
      <section className={operationalStyles.summaryListPanel} aria-label="분기 종합 보고서 요약">
        <dl className={operationalStyles.summaryList}>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>현장</dt>
            <dd className={operationalStyles.summaryListValue}>
              {draft.siteSnapshot.siteName || '-'}
            </dd>
          </div>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>선택 보고서</dt>
            <dd className={operationalStyles.summaryListValue}>
              {draft.generatedFromSessionIds.length}건
            </dd>
          </div>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>수정일</dt>
            <dd className={operationalStyles.summaryListValue}>
              {formatDateTimeLabel(draft.updatedAt || draft.lastCalculatedAt)}
            </dd>
          </div>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>기간</dt>
            <dd className={operationalStyles.summaryListValue}>
              {formatPeriodRangeLabel(draft.periodStartDate, draft.periodEndDate)}
            </dd>
          </div>
        </dl>
      </section>
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {documentError ? <div className={operationalStyles.bannerError}>{documentError}</div> : null}
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}
    </>
  );
}
