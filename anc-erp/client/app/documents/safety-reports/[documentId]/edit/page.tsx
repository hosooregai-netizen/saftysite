import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyReportEditWorkspace } from "../../../../../components/safety-report-edit-workspace";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadSafetyReportDetailPageData } from "../../../../../lib/safety-report-page-data";

type SafetyReportEditPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyReportEditPage({
  params,
}: SafetyReportEditPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportDetailPageData(documentId);

  return (
    <ErpShell
      title={`보고서 편집 · ${documentId}`}
      subtitle="섹션별 수정과 저장은 독립적으로 처리하고, 우측에서 A4 초안 반영 상태를 함께 확인합니다."
    >
      <div className="section-stack">
        <section className="hero-card report-edit-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Document Workspace</p>
              <h2 className="hero-title">섹션 편집 워크스페이스</h2>
              <p className="hero-subtitle">
                좌측에서 섹션을 이동하고, 중앙에서 content를 검토한 뒤, 우측 A4 미리보기와 누락정보를 함께 보며 저장합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={pageData.detail.sections[0]?.status ?? "review"} />
              <StatusBadge tone="review" label={`warnings ${pageData.detail.warnings.length}건`} />
              <StatusBadge tone="warning" label={`missing ${pageData.detail.missingFields.length}건`} />
            </div>
          </div>
        </section>
      </div>
      <SafetyReportEditWorkspace
        documentId={documentId}
        missingFields={pageData.detail.missingFields}
        sections={pageData.detail.sections}
      />
    </ErpShell>
  );
}
