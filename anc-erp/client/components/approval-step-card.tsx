import type { ApprovalStep } from "../../packages/contracts/src";
import { ApprovalStatusBadge } from "./approval-status-badge";

type ApprovalStepCardProps = {
  step: ApprovalStep;
};

export function ApprovalStepCard({ step }: ApprovalStepCardProps) {
  return (
    <article className="approval-step-card">
      <div className="utility-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="approval-table-document">
          <strong>
            {step.stepOrder}. {step.assigneeLabel ?? step.role}
          </strong>
          <small>{step.assigneeUserId ?? step.role}</small>
        </div>
        <ApprovalStatusBadge status={step.status} />
      </div>
      <div className="hero-badges">
        <span className="pill outline">{step.role}</span>
        <span className="pill outline">{step.required ? "필수 단계" : "선택 단계"}</span>
        <span className="pill outline">{step.actedAt ?? "미처리"}</span>
      </div>
      <p className="helper-text">{step.comment ?? "코멘트 없음"}</p>
    </article>
  );
}
