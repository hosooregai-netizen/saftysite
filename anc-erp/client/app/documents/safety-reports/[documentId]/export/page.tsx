import { ErpShell } from "../../../../../components/erp-shell";
import { A4ReportPreview } from "../../../../../components/a4-report-preview";
import { ReportExportBar } from "../../../../../components/report-export-bar";
import { ReportExportChecklist } from "../../../../../components/report-export-checklist";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadSafetyReportDetailPageData } from "../../../../../lib/safety-report-page-data";

type SafetyReportExportPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyReportExportPage({
  params,
}: SafetyReportExportPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportDetailPageData(documentId);

  return (
    <ErpShell
      title={`최종본 export · ${documentId}`}
      subtitle="latest saved snapshot 기준으로만 export하고, 누락정보와 경고를 함께 확인합니다."
    >
      <div className="section-stack">
        <section className="hero-card report-export-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Export Review</p>
              <h2 className="hero-title">latest saved snapshot 기준 최종본 생성</h2>
              <p className="hero-subtitle">
                export 직전에는 필수 누락, linked data 경고, A4 흐름을 같은 화면에서 검토한 뒤 최종본을 만듭니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="review" label={`warnings ${pageData.detail.warnings.length}건`} />
              <StatusBadge tone="warning" label={`missing ${pageData.detail.missingFields.length}건`} />
            </div>
          </div>
        </section>
      </div>
      <section className="report-preview-layout">
        <div className="section-stack report-side-stack">
          <ReportExportChecklist
            missingFields={pageData.detail.missingFields}
            warnings={pageData.detail.warnings}
          />
        </div>
        <div className="section-stack report-center-stack">
          <A4ReportPreview sections={pageData.detail.sections} watermark="LATEST SNAPSHOT" />
        </div>
        <div className="section-stack report-side-stack">
          <ReportExportBar documentId={documentId} />
        </div>
      </section>
    </ErpShell>
  );
}
