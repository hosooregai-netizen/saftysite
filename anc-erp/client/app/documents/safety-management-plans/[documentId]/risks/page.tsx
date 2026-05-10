import { ErpShell } from "../../../../../components/erp-shell";
import { PlanRequiredDataPanel } from "../../../../../components/plan-required-data-panel";
import { StaleSourceWarningPanel } from "../../../../../components/stale-source-warning-panel";
import { RiskRegisterTable } from "../../../../../components/risk-register-table";
import { WorkTypeTable } from "../../../../../components/work-type-table";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanRisksPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="작업공종 / 위험요인" subtitle="공종별 위험요인과 감소대책 초안을 구성합니다.">
      <section className="hero-card">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Risk Register Workspace</p>
            <h2 className="hero-title">공종별 위험요인 / 감소대책 표</h2>
            <p className="hero-subtitle">공종 선택, 위험요인 후보 생성, 체크리스트 import, 위험도 검토를 한 화면에서 처리합니다.</p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>공종</span>
            <strong>{pageData.detail.workTypes.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>위험요인</span>
            <strong>{pageData.detail.riskItems.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>체크리스트 연결</span>
            <strong>{pageData.detail.plan.inspectionRoundId ? "활성" : "미연결"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>누락 경고</span>
            <strong>{pageData.detail.missingFields.filter((item) => item.sectionKey === "risk_register").length}건</strong>
          </article>
        </div>
      </section>
      <div className="page-grid">
        <WorkTypeTable planId={documentId} items={pageData.detail.workTypes} />
        <div className="section-stack">
          <PlanRequiredDataPanel items={pageData.detail.missingFields.filter((item) => item.sectionKey === "risk_register" || item.sectionKey === "work_types")} />
          <StaleSourceWarningPanel warnings={pageData.detail.warnings} />
        </div>
      </div>
      <div className="section-stack">
        <RiskRegisterTable planId={documentId} items={pageData.detail.riskItems} workTypes={pageData.detail.workTypes} />
      </div>
    </ErpShell>
  );
}
