import type { MissingField, ReviewWarning } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type ReportExportChecklistProps = {
  missingFields: MissingField[];
  warnings: ReviewWarning[];
};

export function ReportExportChecklist({
  missingFields,
  warnings,
}: ReportExportChecklistProps) {
  const requiredCount = missingFields.filter((item) => item.severity === "required").length;
  const recommendedCount = missingFields.length - requiredCount;

  return (
    <section className="panel report-export-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportExportChecklist</p>
          <h3 className="panel-title">최종본 export 전 확인</h3>
        </div>
        <StatusBadge
          tone={requiredCount > 0 ? "warning" : "success"}
          label={requiredCount > 0 ? `${requiredCount}건 차단` : "export 가능"}
        />
      </div>
      <div className="report-export-summary">
        <div className="kv-card">
          <strong>필수 누락</strong>
          <span>{requiredCount}건</span>
        </div>
        <div className="kv-card">
          <strong>권장 보완</strong>
          <span>{recommendedCount}건</span>
        </div>
        <div className="kv-card">
          <strong>검토 경고</strong>
          <span>{warnings.length}건</span>
        </div>
      </div>
      <div className="ops-card-list report-export-list">
        {missingFields.map((item) => (
          <article className="ops-item" key={`${item.field}-${item.sectionKey}`}>
            <strong>{item.label ?? item.field}</strong>
            <span>
              [{item.severity === "required" ? "필수" : "권장"}] {item.reason ?? item.message}
            </span>
          </article>
        ))}
        {warnings.map((item) => (
          <article className="ops-item" key={`${item.type}-${item.sectionKey}`}>
            <strong>{item.type}</strong>
            <span>
              [{item.severity}] {item.message}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
