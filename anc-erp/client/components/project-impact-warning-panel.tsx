import { StatusBadge } from "./status-badge";

export function ProjectImpactWarningPanel() {
  return (
    <section className="card warning-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectImpactWarningPanel</p>
          <h3>하위 문서 영향 경고</h3>
        </div>
        <StatusBadge tone="warning" label="검토 필요" />
      </div>
      <p className="warning-copy">
        공사금액, 발주처 분담, 보고서 제출 여부, 공정율이 바뀌면 계약/점검/보고서/메일 제출 데이터에
        영향을 줄 수 있습니다.
      </p>
    </section>
  );
}
