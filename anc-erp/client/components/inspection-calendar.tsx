import type { InspectionCalendarRoundsResponse } from "../../packages/contracts/src";
import { InspectionStatusBadge } from "./inspection-status-badge";

export function InspectionCalendar({ data }: { data: InspectionCalendarRoundsResponse }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionCalendar</p>
          <h3>점검 캘린더</h3>
          <p>월별 회차와 문서번호, 상태를 운영 큐처럼 빠르게 확인합니다.</p>
        </div>
      </div>
      <div className="inspection-calendar-grid">
        {data.rounds.map((item) => (
          <div className="card card-soft inspection-calendar-card" key={item.round.id}>
            <strong>{item.round.plannedMonth ?? "미정"}</strong>
            <p>{item.round.roundNo}회 / {item.round.documentNo ?? "-"}</p>
            <span className="table-subtext">{item.round.actualInspectionDate ?? item.round.plannedDate ?? "점검일 미정"}</span>
            <InspectionStatusBadge status={item.round.status} />
          </div>
        ))}
      </div>
    </section>
  );
}
