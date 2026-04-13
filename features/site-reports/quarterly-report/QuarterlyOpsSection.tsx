import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';

export function QuarterlyOpsSection(props: {
  draft: QuarterlySummaryReport;
  loading: boolean;
  error: string | null;
}) {
  const { draft, loading, error } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <QuarterlySectionHeader title="5. 건설현장 12대 사망사고 기인물별 핵심 안전조치" />
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {draft.opsAssetId ? (
        <div className={operationalStyles.opsAssetCard}>
          {draft.opsAssetPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.opsAssetPreviewUrl} alt={draft.opsAssetTitle || 'OPS 자료'} className={operationalStyles.opsAssetPreview} />
          ) : (
            <div className={operationalStyles.emptyState}>미리보기 이미지를 표시할 수 없습니다.</div>
          )}
          <div className={operationalStyles.field}>
            <strong className={operationalStyles.reportCardTitle}>{draft.opsAssetTitle || '미지정 자료'}</strong>
            {draft.opsAssetDescription ? <p className={operationalStyles.reportCardDescription}>{draft.opsAssetDescription}</p> : null}
          </div>
        </div>
      ) : loading ? (
        <div className={operationalStyles.emptyState}>OPS 자료를 불러오는 중입니다.</div>
      ) : (
        <div className={operationalStyles.emptyState}>현재 배정된 OPS 자료가 없습니다. 관리자에서 OPS 자료를 등록하면 이 영역에 함께 표시됩니다.</div>
      )}
    </article>
  );
}
