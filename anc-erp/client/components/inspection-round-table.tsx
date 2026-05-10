import Link from "next/link";

import type { InspectionRoundListItem } from "../../packages/contracts/src";
import { InspectionStatusBadge } from "./inspection-status-badge";
import { MilestoneBadge } from "./milestone-badge";

export function InspectionRoundTable({ items }: { items: InspectionRoundListItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionRoundTable</p>
          <h3>점검회차 테이블</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>회차</th>
            <th>문서번호</th>
            <th>예정월</th>
            <th>점검일</th>
            <th>보고서 상태</th>
            <th>발주처 보고서</th>
            <th>업무</th>
            <th>milestone</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.round.id}>
              <td>
                <Link className="inline-link" href={`/inspections/${item.round.id}`}>
                  {item.round.roundNo}회
                </Link>
              </td>
              <td>{item.round.documentNo ?? "-"}</td>
              <td>{item.round.plannedMonth ?? "-"}</td>
              <td>{item.round.actualInspectionDate ?? item.round.plannedDate ?? "-"}</td>
              <td>
                <span className={`micro-pill ${item.ownerReportTasks.some((task) => task.status === "submitted") ? "" : "owner"}`}>
                  {item.ownerReportTasks.every((task) => task.status === "submitted" || task.status === "confirmed")
                    ? "제출 정리"
                    : "미제출 있음"}
                </span>
              </td>
              <td>{item.reportTargetCount}건</td>
              <td>
                <div className="progress-cell">
                  <strong>{item.openTaskCount}건 미완료</strong>
                  <span className="table-subtext">발주처 보고서 {item.ownerReportTasks.length}건 연결</span>
                </div>
              </td>
              <td><MilestoneBadge label={item.round.milestoneLabel} /></td>
              <td><InspectionStatusBadge status={item.round.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
