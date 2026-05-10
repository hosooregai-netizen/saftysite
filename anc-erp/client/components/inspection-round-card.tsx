import Link from "next/link";

import type { InspectionRoundListItem } from "../../packages/contracts/src";
import { InspectionStatusBadge } from "./inspection-status-badge";
import { MilestoneBadge } from "./milestone-badge";

export function InspectionRoundCard({ item }: { item: InspectionRoundListItem }) {
  const submissionState =
    item.ownerReportTasks.length === 0
      ? "보고서 작업 없음"
      : item.ownerReportTasks.every((task) => task.status === "submitted" || task.status === "confirmed")
        ? "제출 정리 완료"
        : "발주처별 제출 확인 필요";

  return (
    <section className="card inspection-round-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionRoundCard</p>
          <h3>
            {item.round.roundNo}회 점검
            {item.round.documentNo ? ` · ${item.round.documentNo}` : ""}
          </h3>
          <p>{item.round.plannedMonth ?? "예정월 미정"} / {item.round.plannedDate ?? "점검일 미정"}</p>
        </div>
        <InspectionStatusBadge status={item.round.status} />
      </div>
      <div className="badge-row">
        <MilestoneBadge label={item.round.milestoneLabel} />
        <span className="pill">발주처 보고서 {item.reportTargetCount}건</span>
        <span className="pill">미완료 업무 {item.openTaskCount}건</span>
      </div>
      <div className="inspection-round-card-grid">
        <div className="kv-card">
          <strong>실제 점검일</strong>
          <span>{item.round.actualInspectionDate ?? item.round.plannedDate ?? "미정"}</span>
        </div>
        <div className="kv-card">
          <strong>제출 상태</strong>
          <span>{submissionState}</span>
        </div>
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <Link className="inline-link" href={`/inspections/${item.round.id}`}>
          회차 상세
        </Link>
        <Link className="inline-link" href={`/inspections/${item.round.id}/tasks`}>
          업무
        </Link>
      </div>
    </section>
  );
}
