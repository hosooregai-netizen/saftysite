import type { ReviewWarning } from "../../packages/contracts/src";

export function StaleSourceWarningPanel({ warnings }: { warnings: ReviewWarning[] }) {
  const staleWarnings = warnings.filter((item) => item.type === "stale_linked_data");
  if (staleWarnings.length === 0) {
    return null;
  }
  return (
    <section className="panel warning-panel plan-warning-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">StaleSourceWarningPanel</p>
          <h3 className="panel-title">원본 변경 경고</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {staleWarnings.map((warning, index) => (
          <article className="ops-item plan-warning-item" key={`${warning.type}-${index}`}>
            <strong>{warning.sectionKey ?? "section"}</strong>
            <span>{warning.message}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
