import type { InspectionRoundListItem } from "../../packages/contracts/src";
import { MilestoneBadge } from "./milestone-badge";

export function InspectionTimeline({ items }: { items: InspectionRoundListItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionTimeline</p>
          <h3>점검 타임라인</h3>
        </div>
      </div>
      <div className="section-stack">
        {items.map((item) => (
          <div className="missing-item" key={item.round.id}>
            <strong>
              {item.round.roundNo}회 · {item.round.plannedMonth ?? "미정"}
            </strong>
            <span>{item.round.documentNo ?? "문서번호 미정"}</span>
            <MilestoneBadge label={item.round.milestoneLabel} />
          </div>
        ))}
      </div>
    </section>
  );
}
