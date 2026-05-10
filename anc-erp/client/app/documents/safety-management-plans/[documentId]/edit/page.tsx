import { ErpShell } from "../../../../../components/erp-shell";
import { PlanRequiredDataPanel } from "../../../../../components/plan-required-data-panel";
import { PlanStatusBadge } from "../../../../../components/plan-status-badge";
import { StaleSourceWarningPanel } from "../../../../../components/stale-source-warning-panel";
import { SafetyManagementPlanEditWorkspace } from "../../../../../components/safety-management-plan-edit-workspace";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanEditPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="안전관리계획서 편집" subtitle="섹션별 draft 저장과 regenerate를 같은 화면에서 검토합니다.">
      <section className="hero-card report-edit-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Edit Workspace</p>
            <h2 className="hero-title">{pageData.detail.plan.title}</h2>
            <p className="hero-subtitle">좌측 섹션 이동, 중앙 편집, 우측 A4 미리보기 구조로 draft와 저장 상태를 함께 검토합니다.</p>
          </div>
          <PlanStatusBadge label={pageData.detail.plan.status} />
        </div>
        <div className="report-meta-strip">
          <span>프로젝트: {pageData.detail.snapshot.projectSnapshot.projectName}</span>
          <span>필수 누락: {pageData.detail.missingFields.length}건</span>
          <span>검토 경고: {pageData.detail.warnings.length}건</span>
        </div>
      </section>
      <div className="page-grid">
        <PlanRequiredDataPanel items={pageData.detail.missingFields} />
        <StaleSourceWarningPanel warnings={pageData.detail.warnings} />
      </div>
      <SafetyManagementPlanEditWorkspace planId={documentId} sections={pageData.detail.sections} />
    </ErpShell>
  );
}
