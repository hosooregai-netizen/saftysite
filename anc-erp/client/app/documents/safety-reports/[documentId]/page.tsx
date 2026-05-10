import Link from "next/link";

import { ErpShell } from "../../../../components/erp-shell";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { ReportLinkedDataPanel } from "../../../../components/report-linked-data-panel";
import { ReportVersionHistory } from "../../../../components/report-version-history";
import { SafetyReportSummaryCard } from "../../../../components/safety-report-summary-card";
import { StatusBadge } from "../../../../components/status-badge";
import { loadSafetyReportDetailPageData } from "../../../../lib/safety-report-page-data";

type DocumentDetailPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportDetailPageData(documentId);

  return (
    <ErpShell
      title={`보고서 상세 · ${documentId}`}
      subtitle="문서 요약, linked data, version, 누락정보를 기준으로 다음 작업을 결정합니다."
    >
      <div className="section-stack">
        <SafetyReportSummaryCard detail={pageData.detail} />
        <section className="quick-link-row report-link-row">
          <Link className="quick-link" href={`/documents/safety-reports/${documentId}/edit`}>
            편집
          </Link>
          <Link className="quick-link" href={`/documents/safety-reports/${documentId}/preview`}>
            A4 미리보기
          </Link>
          <Link className="quick-link" href={`/documents/safety-reports/${documentId}/sections`}>
            섹션 관리
          </Link>
          <Link className="quick-link" href={`/documents/safety-reports/${documentId}/variables`}>
            변수 관리
          </Link>
          <Link className="quick-link" href={`/documents/safety-reports/${documentId}/export`}>
            export
          </Link>
          <Link className="quick-link" href={`/documents/safety-reports/${documentId}/submission`}>
            제출
          </Link>
        </section>
        <section className="feature-split">
          <div className="section-stack">
            <ReportLinkedDataPanel detail={pageData.detail} />
            <ReportVersionHistory versions={pageData.detail.versions} />
          </div>
          <div className="section-stack">
            <section className="panel report-overview-panel">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Overview</p>
                  <h3 className="panel-title">현재 검토 포인트</h3>
                </div>
              </div>
              <div className="status-stack">
                <StatusBadge tone="info" label={`sections ${pageData.detail.sections.length}개`} />
                <StatusBadge tone="review" label={`warnings ${pageData.detail.warnings.length}건`} />
                <StatusBadge tone="warning" label={`missing ${pageData.detail.missingFields.length}건`} />
              </div>
              <p className="helper-text">
                발주처 branch와 linked data 변동 여부를 먼저 확인한 뒤, 편집 또는 export 단계로 이동하는 흐름을 권장합니다.
              </p>
            </section>
            <MissingFieldPanel
              title="문서 생성 / export 전 누락정보"
              items={pageData.detail.missingFields.map((item) => ({
                label: item.label ?? item.field,
                reason: item.reason ?? item.message,
                severity: item.severity === "required" ? "required" : "recommended",
              }))}
            />
          </div>
        </section>
      </div>
    </ErpShell>
  );
}
