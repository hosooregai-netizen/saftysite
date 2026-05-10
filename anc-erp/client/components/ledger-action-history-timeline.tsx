import type { LedgerFindingHistory } from "../../packages/contracts/src";

export function LedgerActionHistoryTimeline({ items }: { items: LedgerFindingHistory[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerActionHistoryTimeline</p>
          <h3 className="panel-title">조치 확인 타임라인</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {items.map((item) => (
          <article className="ops-item" key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.actionDetail ?? "조치 초안 없음"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
