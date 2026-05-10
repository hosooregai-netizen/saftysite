import type { InspectionRoundListItem } from "../../packages/contracts/src";
import { InspectionStatusBadge } from "./inspection-status-badge";

export function InspectionMonthGrid({ items }: { items: InspectionRoundListItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionMonthGrid</p>
          <h3>월별 예정월 grid</h3>
        </div>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <div className="card card-soft" key={item.round.id}>
            <strong>{item.round.roundNo}회</strong>
            <p>{item.round.plannedMonth ?? "미정"}</p>
            <InspectionStatusBadge status={item.round.status} />
          </div>
        ))}
      </div>
    </section>
  );
}
