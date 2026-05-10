import type { SafetyCostUsageListItem } from "../../packages/contracts/src";
import { SafetyCostStatusBadge } from "./safety-cost-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyCostSummaryCardProps = {
  item: SafetyCostUsageListItem;
};

export function SafetyCostSummaryCard({ item }: SafetyCostSummaryCardProps) {
  const usage = item.usage;

  return (
    <section className="panel safety-cost-summary-card">
      <div className="card-head safety-cost-summary-head">
        <div>
          <p className="card-eyebrow">SafetyCostSummaryCard</p>
          <h3 className="panel-title">{item.ownerDisplayName}</h3>
          <p className="muted">점검회차 {usage.inspectionRoundId} · 기준 {usage.basisMonth ?? usage.basisDate ?? "미입력"}</p>
        </div>
        <div className="status-stack">
          <SafetyCostStatusBadge status={usage.status} />
          <StatusBadge
            tone={usage.appropriatenessStatus === "appropriate" ? "success" : usage.appropriatenessStatus === "not_reviewed" ? "info" : "review"}
            label={usage.appropriatenessStatus}
          />
        </div>
      </div>
      <div className="safety-cost-rate-strip">
        <div className="safety-cost-rate-head">
          <span>사용률</span>
          <strong>{usage.usedRateCalculated.toFixed(1)}%</strong>
        </div>
        <div className="progress-track compact">
          <div className="progress-fill" style={{ width: `${Math.min(usage.usedRateCalculated, 100)}%` }} />
        </div>
        {usage.userEnteredRate !== undefined && usage.userEnteredRate !== null ? (
          <p className="helper-text">입력값 {usage.userEnteredRate.toFixed(1)}%</p>
        ) : null}
      </div>
      <dl className="detail-grid safety-cost-metric-grid">
        <div>
          <dt>계상금액</dt>
          <dd>{usage.calculatedAmount.toLocaleString()}원</dd>
        </div>
        <div>
          <dt>사용금액</dt>
          <dd>{usage.usedAmount.toLocaleString()}원</dd>
        </div>
        <div>
          <dt>관련근거</dt>
          <dd>{usage.basisDocumentText ?? "미입력"}</dd>
        </div>
        <div>
          <dt>보고서</dt>
          <dd>{usage.status === "synced_to_report" ? "반영 완료" : "반영 대기"}</dd>
        </div>
        <div>
          <dt>증빙</dt>
          <dd>{item.evidenceCount}건</dd>
        </div>
        <div>
          <dt>경고</dt>
          <dd>{item.warnings.length}건</dd>
        </div>
      </dl>
      <div className="badge-row">
        {item.warnings.length ? (
          item.warnings.slice(0, 2).map((warning) => (
            <StatusBadge
              key={`${usage.id}-${warning.type}`}
              tone={warning.severity === "danger" ? "danger" : warning.severity === "warning" ? "warning" : "info"}
              label={warning.type}
            />
          ))
        ) : (
          <StatusBadge tone="success" label="검토 경고 없음" />
        )}
      </div>
    </section>
  );
}
