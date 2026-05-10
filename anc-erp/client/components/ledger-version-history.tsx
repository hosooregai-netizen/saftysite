import type { SafetyHealthLedgerVersion } from "../../packages/contracts/src";

export function LedgerVersionHistory({ items }: { items: SafetyHealthLedgerVersion[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerVersionHistory</p>
          <h3 className="panel-title">버전 이력</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {items.map((item) => (
          <article className="ops-item" key={item.id}>
            <strong>v{item.versionNo}</strong>
            <span>{item.changeSummary ?? "변경 요약 없음"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
