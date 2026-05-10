import type { SafetyReportVariablesResponse } from "../../packages/contracts/src";

type ReportVariablePanelProps = {
  payload: SafetyReportVariablesResponse;
};

export function ReportVariablePanel({ payload }: ReportVariablePanelProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportVariablePanel</p>
          <h3 className="panel-title">변수 / 데이터 출처</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {Object.entries(payload.variables).map(([key, value]) => (
          <article className="ops-item" key={key}>
            <strong>{key}</strong>
            <span>{String(value ?? "-")}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

