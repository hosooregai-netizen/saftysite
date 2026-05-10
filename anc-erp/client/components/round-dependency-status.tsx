import type { InspectionRoundDetailResponse } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function RoundDependencyStatus({ detail }: { detail: InspectionRoundDetailResponse }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RoundDependencyStatus</p>
          <h3>회차 종료 선행조건</h3>
        </div>
      </div>
      <div className="link-list">
        {detail.warnings.length === 0 ? (
          <StatusBadge tone="success" label="종료 가능" />
        ) : (
          detail.warnings.map((warning, index) => (
            <StatusBadge key={`${warning}-${index}`} tone="warning" label={warning} />
          ))
        )}
      </div>
    </section>
  );
}
