import type { SafetyManagementPlanDetailResponse } from "../../packages/contracts/src";
import { PlanStatusBadge } from "./plan-status-badge";

export function PlanSummaryCard({ detail }: { detail: SafetyManagementPlanDetailResponse }) {
  return (
    <section className="panel report-overview-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanSummaryCard</p>
          <h3 className="panel-title">문서 요약</h3>
        </div>
        <PlanStatusBadge label={detail.plan.status} />
      </div>
      <div className="report-export-summary">
        <div className="kv-card">
          <strong>프로젝트</strong>
          <span>{detail.snapshot.projectSnapshot.projectName}</span>
        </div>
        <div className="kv-card">
          <strong>개정 차수</strong>
          <span>{detail.plan.revisionNo}차</span>
        </div>
        <div className="kv-card">
          <strong>공종 / 위험요인</strong>
          <span>
            {detail.workTypes.length}건 / {detail.riskItems.length}건
          </span>
        </div>
        <div className="kv-card">
          <strong>첨부 / 버전</strong>
          <span>
            {detail.attachments.length}건 / {detail.versions.length}건
          </span>
        </div>
      </div>
    </section>
  );
}
