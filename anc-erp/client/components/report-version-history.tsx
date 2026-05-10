import type { SafetyReportVersion } from "../../packages/contracts/src";

type ReportVersionHistoryProps = {
  versions: SafetyReportVersion[];
};

export function ReportVersionHistory({ versions }: ReportVersionHistoryProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Version History</p>
          <h3 className="panel-title">저장 snapshot 이력</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {versions.map((item) => (
          <article className="ops-item" key={item.id}>
            <strong>v{item.versionNo}</strong>
            <span>
              {item.changeSummary ?? "변경 요약 없음"} · {item.createdAt.slice(0, 10)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

