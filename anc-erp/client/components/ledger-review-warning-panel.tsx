import type { ReviewWarning } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function LedgerReviewWarningPanel({ warnings }: { warnings: ReviewWarning[] }) {
  return (
    <section className="panel warning-panel ledger-warning-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerReviewWarningPanel</p>
          <h3 className="panel-title">검토 경고</h3>
          <p className="card-copy">반복 위험, 미조치 지적, 원본 변경, export 전 확인 항목을 우선 검토합니다.</p>
        </div>
        <StatusBadge tone="warning" label={`${warnings.length}건`} />
      </div>
      <div className="ops-card-list">
        {warnings.map((warning, index) => (
          <article className={`ops-item ledger-warning-item ${warning.severity ?? "warning"}`} key={`${warning.type}-${index}`}>
            <strong>{warning.sectionKey ?? "section"}</strong>
            <span>{warning.message}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
