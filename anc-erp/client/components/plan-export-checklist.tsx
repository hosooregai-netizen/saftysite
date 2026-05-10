import type { MissingField } from "../../packages/contracts/src";

export function PlanExportChecklist({
  missingFields,
  hasExportedFile,
}: {
  missingFields: MissingField[];
  hasExportedFile: boolean;
}) {
  const items = [
    {
      label: "필수 프로젝트 정보",
      state: missingFields.some((item) => item.sectionKey === "project_overview") ? "warning" : "success",
      description: "프로젝트 원장과 계약 정보 연결 여부",
    },
    {
      label: "위험요인 / 감소대책",
      state: missingFields.some((item) => item.sectionKey === "risk_register") ? "warning" : "success",
      description: "공종별 위험요인 register 확인",
    },
    {
      label: "교육 / 비상연락망",
      state:
        missingFields.some((item) => item.sectionKey === "safety_education" || item.sectionKey === "emergency_response")
          ? "warning"
          : "success",
      description: "교육계획과 비상연락망 검토",
    },
    {
      label: "첨부자료 / 최신 저장 여부",
      state: hasExportedFile ? "success" : "info",
      description: "웹하드 저장 위치와 최신 snapshot 기준 export",
    },
  ];

  return (
    <section className="panel report-export-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanExportChecklist</p>
          <h3 className="panel-title">export 전 체크리스트</h3>
        </div>
      </div>
      <div className="ops-card-list report-export-list">
        {items.map((item) => (
          <article className={`ops-item export-check-item ${item.state}`} key={item.label}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
