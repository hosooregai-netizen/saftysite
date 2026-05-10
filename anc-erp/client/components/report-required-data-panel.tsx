import type { MissingField, ReviewWarning } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type ReportRequiredDataPanelProps = {
  requiredData: MissingField[];
  warnings: ReviewWarning[];
};

export function ReportRequiredDataPanel({
  requiredData,
  warnings,
}: ReportRequiredDataPanelProps) {
  return (
    <section className="panel report-required-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportRequiredDataPanel</p>
          <h3 className="panel-title">초안 생성 전 확인</h3>
        </div>
        <StatusBadge tone="warning" label={`${requiredData.length + warnings.length}건`} />
      </div>
      <div className="report-export-summary">
        <div className="kv-card">
          <strong>필수 데이터</strong>
          <span>{requiredData.length}건</span>
        </div>
        <div className="kv-card">
          <strong>검토 경고</strong>
          <span>{warnings.length}건</span>
        </div>
      </div>
      <div className="ops-card-list">
        {requiredData.map((item) => (
          <article className="ops-item" key={`${item.field}-${item.sectionKey}`}>
            <strong>{item.label ?? item.field}</strong>
            <span>{item.reason ?? item.message}</span>
          </article>
        ))}
        {warnings.map((item) => (
          <article className="ops-item" key={`${item.type}-${item.sectionKey}`}>
            <strong>{item.type}</strong>
            <span>{item.message}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
