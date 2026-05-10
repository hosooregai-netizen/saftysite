import type { SafetyCostHistoryEvent } from "../../packages/contracts/src";

type SafetyCostHistoryTimelineProps = {
  items: SafetyCostHistoryEvent[];
};

export function SafetyCostHistoryTimeline({ items }: SafetyCostHistoryTimelineProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostHistoryTimeline</p>
          <h3 className="panel-title">변경 이력</h3>
        </div>
      </div>
      <div className="section-stack">
        {items.map((item) => (
          <div className="timeline-item" key={item.id}>
            <strong>{item.summary}</strong>
            <span>{item.createdAt}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
