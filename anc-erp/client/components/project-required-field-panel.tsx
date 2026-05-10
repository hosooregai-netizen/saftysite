import type { ProjectRequirementStatus } from "../../packages/contracts/src";

import { MissingFieldPanel } from "./missing-field-panel";
import { StatusBadge } from "./status-badge";

export function ProjectRequiredFieldPanel({
  requirements,
}: {
  requirements: ProjectRequirementStatus;
}) {
  const groups = [
    { title: "보고서 생성 전", items: requirements.forSafetyReport, tone: "review" as const },
    { title: "계약서 생성 전", items: requirements.forContract, tone: "info" as const },
    { title: "점검회차 생성 전", items: requirements.forInspectionRound, tone: "success" as const },
    { title: "메일 제출 전", items: requirements.forMailSubmission, tone: "warning" as const },
  ];

  const items = groups.flatMap((group) =>
    group.items.map((item) => ({
      label: `${group.title} · ${item.field}`,
      reason: item.message,
      severity: item.severity,
    })),
  );

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ProjectRequiredFieldPanel</p>
          <h3>프로젝트 원장 누락 정보</h3>
          <p>문서, 계약, 점검, 메일 제출 전에 확인해야 할 필수정보를 그룹별로 나눠 보여줍니다.</p>
        </div>
        <StatusBadge tone={items.length > 0 ? "warning" : "success"} label={items.length > 0 ? `${items.length}건 검토` : "준비 완료"} />
      </div>
      <div className="requirement-groups">
        {groups.map((group) => (
          <article className="requirement-card" key={group.title}>
            <div className="card-head">
              <div>
                <p className="card-eyebrow">{group.title}</p>
                <h3>{group.items.length > 0 ? `${group.items.length}건 확인 필요` : "누락 없음"}</h3>
              </div>
              <StatusBadge tone={group.tone} label={group.title} />
            </div>
            <MissingFieldPanel
              title={group.title}
              items={
                group.items.length > 0
                  ? group.items.map((item) => ({
                      label: item.field,
                      reason: item.message,
                      severity: item.severity,
                    }))
                  : [
                      {
                        label: "확인 완료",
                        reason: `${group.title} 기준 필수값이 현재는 충족되어 있습니다.`,
                        severity: "recommended",
                      },
                    ]
              }
            />
          </article>
        ))}
      </div>
      {requirements.warnings.length > 0 ? (
        <div className="badge-row" style={{ marginTop: 12 }}>
          {requirements.warnings.map((warning, index) => (
            <StatusBadge key={`${warning}-${index}`} tone="warning" label={warning} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
