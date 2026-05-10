import { ErpShell } from "../../../../../components/erp-shell";
import { PlanA4Preview } from "../../../../../components/plan-a4-preview";
import { PlanExportChecklist } from "../../../../../components/plan-export-checklist";
import { PlanExportBar } from "../../../../../components/plan-export-bar";
import { StaleSourceWarningPanel } from "../../../../../components/stale-source-warning-panel";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanExportPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="안전관리계획서 export" subtitle="최신 저장 snapshot 기준으로 최종본을 export합니다.">
      <section className="hero-card report-export-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Export Review</p>
            <h2 className="hero-title">최종본 export 전 검토</h2>
            <p className="hero-subtitle">필수정보, 위험요인 register, 교육계획, 비상연락망, 첨부자료, 최신 저장 여부를 함께 확인합니다.</p>
          </div>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <PlanA4Preview sections={pageData.detail.sections} />
        </div>
        <div className="feature-side-stack">
          <PlanExportChecklist
            hasExportedFile={Boolean(pageData.detail.plan.exportedFileId)}
            missingFields={pageData.validation.missingFields}
          />
          <StaleSourceWarningPanel warnings={pageData.detail.warnings} />
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Export Action</p>
                <h3 className="panel-title">최종본 생성</h3>
              </div>
            </div>
            <PlanExportBar path={pageData.detail.exportedFile?.storagePath} planId={documentId} />
          </section>
        </div>
      </div>
    </ErpShell>
  );
}
