import type { SubmissionReadinessResponse } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type SubmissionReadinessPanelProps = {
  readiness: SubmissionReadinessResponse;
};

export function SubmissionReadinessPanel({ readiness }: SubmissionReadinessPanelProps) {
  const blockedCount = readiness.warnings.filter((warning) => warning.severity === "blocked" || warning.severity === "error").length;
  const warningCount = readiness.warnings.filter((warning) => warning.severity === "warning").length;
  const stepCards = [
    {
      label: "결재",
      value: readiness.workflow ? readiness.workflow.status : "미요청",
      ready: readiness.workflow?.status === "approved",
    },
    {
      label: "서명/날인",
      value: `${readiness.signatureTasks.filter((task) => task.status === "completed").length}/${readiness.signatureTasks.length} 완료`,
      ready: readiness.signatureTasks.every((task) => !task.required || task.status === "completed" || task.status === "waived"),
    },
    {
      label: "패키지",
      value: readiness.package?.status ?? "미생성",
      ready: Boolean(readiness.package?.mainFileId),
    },
  ];

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Submission Readiness</p>
          <h3 className="panel-title">제출 가능 상태</h3>
          <p className="card-copy">제출 전 차단 사유, 권고사항, 파일 패키지 상태를 같은 문맥에서 확인합니다.</p>
        </div>
        <StatusBadge tone={readiness.ready ? "success" : "warning"} label={readiness.ready ? "ready" : "blocked"} />
      </div>
      <div className="approval-summary-grid">
        <article className="ops-item">
          <strong>blocked</strong>
          <span>{blockedCount}건</span>
        </article>
        <article className="ops-item">
          <strong>warning</strong>
          <span>{warningCount}건</span>
        </article>
        <article className="ops-item">
          <strong>ownerPartyId</strong>
          <span>{readiness.document.ownerPartyId}</span>
        </article>
        <article className="ops-item">
          <strong>mainFileId</strong>
          <span>{readiness.package?.mainFileId ?? "미연결"}</span>
        </article>
      </div>
      <div className="approval-summary-grid">
        {stepCards.map((card) => (
          <article className="ops-item" key={card.label}>
            <strong>{card.label}</strong>
            <span>{card.value}</span>
            <span>{card.ready ? "ready" : "확인 필요"}</span>
          </article>
        ))}
      </div>
      <div className="submission-warning-list">
        {readiness.warnings.map((warning) => (
          <article className="submission-warning-card" key={warning.code}>
            <div className="utility-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="approval-table-document">
                <strong>{warning.code}</strong>
                <small>{warning.field ?? "document"}</small>
              </div>
              <StatusBadge
                tone={warning.severity === "warning" ? "warning" : "danger"}
                label={warning.severity}
              />
            </div>
            <p className="helper-text">{warning.message}</p>
          </article>
        ))}
        {readiness.warnings.length === 0 ? (
          <article className="submission-warning-card">
            <div className="utility-row" style={{ justifyContent: "space-between" }}>
              <strong>제출 차단 없음</strong>
              <StatusBadge tone="success" label="ready" />
            </div>
            <p className="helper-text">현재 연결된 approval, signature, package 기준으로 추가 경고가 없습니다.</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
