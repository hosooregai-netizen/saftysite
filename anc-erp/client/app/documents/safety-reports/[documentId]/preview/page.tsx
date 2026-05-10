import { ErpShell } from "../../../../../components/erp-shell";
import { A4ReportPreview } from "../../../../../components/a4-report-preview";
import { MissingFieldPanel } from "../../../../../components/missing-field-panel";
import { PageNavigator } from "../../../../../components/page-navigator";
import { PrintLayoutWarningPanel } from "../../../../../components/print-layout-warning-panel";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadSafetyReportDetailPageData } from "../../../../../lib/safety-report-page-data";

type SafetyReportPreviewPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyReportPreviewPage({
  params,
}: SafetyReportPreviewPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportDetailPageData(documentId);

  return (
    <ErpShell
      title={`A4 미리보기 · ${documentId}`}
      subtitle="최종본 export 전에 전체 section 흐름과 누락정보를 A4 기준으로 검토합니다."
    >
      <div className="section-stack">
        <section className="hero-card report-preview-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">A4 Preview</p>
              <h2 className="hero-title">문서형 검토 화면</h2>
              <p className="hero-subtitle">
                중앙의 A4 흐름, 좌우의 누락정보와 section 진행 상태를 함께 보며 최종 검토 감각을 맞춥니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={`${pageData.detail.sections.length} sections`} />
              <StatusBadge tone="review" label={`${pageData.detail.warnings.length} warnings`} />
            </div>
          </div>
        </section>
      </div>
      <section className="report-preview-layout">
        <div className="section-stack report-side-stack">
          <PageNavigator
            items={[
              { href: `/documents/safety-reports/${documentId}`, label: "상세" },
              { href: `/documents/safety-reports/${documentId}/edit`, label: "편집" },
              { href: `/documents/safety-reports/${documentId}/preview`, label: "미리보기", active: true },
              { href: `/documents/safety-reports/${documentId}/export`, label: "export" },
            ]}
          />
          <MissingFieldPanel
            items={pageData.detail.missingFields.map((item) => ({
              label: item.label ?? item.field,
              reason: item.reason ?? item.message,
              severity: item.severity === "required" ? "required" : "recommended",
            }))}
          />
        </div>
        <div className="section-stack report-center-stack">
          <A4ReportPreview sections={pageData.detail.sections} />
        </div>
        <div className="section-stack report-side-stack">
          <section className="panel report-overview-panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Section Review</p>
                <h3 className="panel-title">섹션 진행 현황</h3>
              </div>
            </div>
            <div className="ops-card-list">
              {pageData.detail.sections.slice(0, 8).map((section) => (
                <article className="ops-item" key={section.id}>
                  <strong>{section.title}</strong>
                  <span>{section.status}</span>
                </article>
              ))}
            </div>
          </section>
          <PrintLayoutWarningPanel warnings={pageData.detail.warnings} />
        </div>
      </section>
    </ErpShell>
  );
}
