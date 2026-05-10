import type { ReviewWarning } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type PrintLayoutWarningPanelProps = {
  warnings: ReviewWarning[];
};

export function PrintLayoutWarningPanel({
  warnings,
}: PrintLayoutWarningPanelProps) {
  return (
    <section className="panel report-print-warning-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PrintLayoutWarningPanel</p>
          <h3 className="panel-title">출력 전 인쇄 주의</h3>
        </div>
        <StatusBadge tone={warnings.length > 0 ? "warning" : "success"} label={`${warnings.length}건`} />
      </div>
      <div className="ops-card-list">
        <article className="ops-item">
          <strong>A4 흐름 확인</strong>
          <span>표지, 점검표, 사진대지, 산안비 section 순서가 실제 제출본과 맞는지 검토합니다.</span>
        </article>
        {warnings.map((warning) => (
          <article className="ops-item" key={`${warning.type}-${warning.sectionKey}`}>
            <strong>{warning.type}</strong>
            <span>{warning.message}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
