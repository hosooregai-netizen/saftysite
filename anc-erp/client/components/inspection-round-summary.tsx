import type { InspectionRoundDetailResponse } from "../../packages/contracts/src";
import { InspectionStatusBadge } from "./inspection-status-badge";
import { MilestoneBadge } from "./milestone-badge";

export function InspectionRoundSummary({ detail }: { detail: InspectionRoundDetailResponse }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionRoundSummary</p>
          <h3>
            {detail.round.roundNo}회 점검
            {detail.round.documentNo ? ` · ${detail.round.documentNo}` : ""}
          </h3>
          <p>{detail.project.projectName}</p>
        </div>
        <InspectionStatusBadge status={detail.round.status} />
      </div>
      <div className="badge-row">
        <MilestoneBadge label={detail.round.milestoneLabel} />
        <span className="pill">발주처 보고서 {detail.ownerReportTasks.length}건</span>
        <span className="pill">첨부 {detail.attachments.length}건</span>
      </div>
      <div className="inspection-summary-grid">
        <div className="kv-card">
          <strong>예정월 / 점검일</strong>
          <span>{detail.round.plannedMonth ?? "미정"} / {detail.round.plannedDate ?? "미정"}</span>
        </div>
        <div className="kv-card">
          <strong>실제 점검일</strong>
          <span>{detail.round.actualInspectionDate ?? "미입력"}</span>
        </div>
        <div className="kv-card">
          <strong>보고서 마감</strong>
          <span>{detail.round.reportDueDate ?? "미정"}</span>
        </div>
        <div className="kv-card">
          <strong>연결 상태</strong>
          <span>업무 {detail.tasks.length}건 / 첨부 {detail.attachments.length}건</span>
        </div>
      </div>
    </section>
  );
}
