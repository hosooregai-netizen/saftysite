import Link from "next/link";

import { AttachmentLinkPanel } from "../../../../components/attachment-link-panel";
import { ErpShell } from "../../../../components/erp-shell";
import { InspectionPlanTable } from "../../../../components/inspection-plan-table";
import { PlanA4Preview } from "../../../../components/plan-a4-preview";
import { PlanExportChecklist } from "../../../../components/plan-export-checklist";
import { PlanRequiredDataPanel } from "../../../../components/plan-required-data-panel";
import { PlanStatusBadge } from "../../../../components/plan-status-badge";
import { PlanSummaryCard } from "../../../../components/plan-summary-card";
import { PlanVariablePanel } from "../../../../components/plan-variable-panel";
import { PlanVersionHistory } from "../../../../components/plan-version-history";
import { StaleSourceWarningPanel } from "../../../../components/stale-source-warning-panel";
import { loadSafetyManagementPlanDetailPageData } from "../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanDetailPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title={pageData.detail.plan.title} subtitle="안전관리계획서 상세와 연결 데이터 검토">
      <section className="hero-card report-summary-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Safety Management Plan</p>
            <h2 className="hero-title">{pageData.detail.plan.title}</h2>
            <p className="hero-subtitle">
              프로젝트 계획 문서의 위험요인, 조직, 교육, 비상대응, 첨부자료를 연결된 원장 기준으로 검토합니다.
            </p>
          </div>
          <PlanStatusBadge label={pageData.detail.plan.status} />
        </div>
        <div className="report-meta-strip">
          <span>프로젝트: {pageData.detail.snapshot.projectSnapshot.projectName}</span>
          <span>시공사: {pageData.detail.snapshot.projectSnapshot.contractorName ?? "미연결"}</span>
          <span>개정: {pageData.detail.plan.revisionNo}차</span>
          <span>템플릿: {pageData.detail.plan.templateId}</span>
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
            <span>첨부자료</span>
            <strong>{pageData.detail.attachments.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>필수 누락</span>
            <strong>{pageData.detail.missingFields.length}건</strong>
          </article>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <PlanSummaryCard detail={pageData.detail} />
          <PlanA4Preview sections={pageData.detail.sections} />
        </div>
        <div className="feature-side-stack">
          <section className="panel report-quick-panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Document Actions</p>
                <h3 className="panel-title">계획서 작업</h3>
              </div>
            </div>
            <div className="ops-card-list">
              <article className="ops-item">
                <strong>편집</strong>
                <Link className="inline-link" href={`/documents/safety-management-plans/${documentId}/edit`}>섹션 편집</Link>
              </article>
              <article className="ops-item">
                <strong>위험요인 / 감소대책</strong>
                <Link className="inline-link" href={`/documents/safety-management-plans/${documentId}/risks`}>register 검토</Link>
              </article>
              <article className="ops-item">
                <strong>export 준비</strong>
                <Link className="inline-link" href={`/documents/safety-management-plans/${documentId}/export`}>최종본 검토</Link>
              </article>
            </div>
          </section>
          <PlanRequiredDataPanel items={pageData.validation.missingFields} />
          <StaleSourceWarningPanel warnings={pageData.detail.warnings} />
          <PlanExportChecklist
            hasExportedFile={Boolean(pageData.detail.plan.exportedFileId)}
            missingFields={pageData.validation.missingFields}
          />
        </div>
      </div>
      <div className="page-grid">
        <PlanVariablePanel variables={pageData.detail.snapshot.variables} />
        <AttachmentLinkPanel planId={documentId} items={pageData.detail.attachments} />
      </div>
      <InspectionPlanTable inspectionRoundId={pageData.detail.plan.inspectionRoundId} />
      <PlanVersionHistory versions={pageData.detail.versions} />
    </ErpShell>
  );
}
