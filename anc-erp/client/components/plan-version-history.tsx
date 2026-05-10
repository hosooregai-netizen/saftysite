import type { SafetyManagementPlanVersion } from "../../packages/contracts/src";

export function PlanVersionHistory({ versions }: { versions: SafetyManagementPlanVersion[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanVersionHistory</p>
          <h3 className="panel-title">버전 이력</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {versions.map((version) => (
          <article className="ops-item" key={version.id}>
            <strong>v{version.versionNo}</strong>
            <span>{version.changeSummary ?? "변경 요약 없음"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
