import { ErpShell } from "../../../../../../components/erp-shell";
import { ReportRequiredDataPanel } from "../../../../../../components/report-required-data-panel";
import { SafetyReportWizard } from "../../../../../../components/safety-report-wizard";
import { loadSafetyReportCreatePageData } from "../../../../../../lib/safety-report-page-data";

type SafetyReportCreatePageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function SafetyReportCreatePage({
  params,
}: SafetyReportCreatePageProps) {
  const { projectId } = await params;
  const pageData = await loadSafetyReportCreatePageData(projectId);

  return (
    <ErpShell
      title="이행확인 보고서 초안 생성"
      subtitle="점검회차와 발주처 분기를 선택해 linked data 기반 초안을 생성합니다."
    >
      <div className="section-stack">
        <section className="hero-card report-create-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Draft Wizard</p>
              <h2 className="hero-title">owner-specific 문서 branch 생성</h2>
              <p className="hero-subtitle">
                linked data를 읽어 초안을 만들되, 법정 문구와 최종 판단은 저장 후 사람이 검토하는 흐름을 유지합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="feature-split">
        <div className="section-stack report-main-stack">
          <SafetyReportWizard
            inspectionRounds={pageData.rounds}
            projectId={projectId}
            requiredData={pageData.requiredData}
          />
        </div>
        <div className="section-stack">
          <ReportRequiredDataPanel
            requiredData={pageData.requiredData.requiredData}
            warnings={pageData.requiredData.warnings}
          />
        </div>
      </div>
    </ErpShell>
  );
}
