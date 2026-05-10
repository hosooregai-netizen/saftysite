import type { ApprovalStep } from "../../packages/contracts/src";
import { ApprovalStepCard } from "./approval-step-card";

type ApprovalStepperProps = {
  steps: ApprovalStep[];
};

export function ApprovalStepper({ steps }: ApprovalStepperProps) {
  const completedCount = steps.filter((step) => step.status === "approved" || step.status === "completed").length;

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Approval Steps</p>
          <h3 className="panel-title">결재 단계</h3>
          <p className="card-copy">필수 단계와 코멘트를 함께 보여주어 제출 readiness 차단 원인을 바로 파악할 수 있습니다.</p>
        </div>
      </div>
      <div className="approval-summary-grid">
        <article className="ops-item">
          <strong>총 단계</strong>
          <span>{steps.length}개</span>
        </article>
        <article className="ops-item">
          <strong>완료 단계</strong>
          <span>{completedCount}개</span>
        </article>
        <article className="ops-item">
          <strong>필수 단계</strong>
          <span>{steps.filter((step) => step.required).length}개</span>
        </article>
        <article className="ops-item">
          <strong>대기 단계</strong>
          <span>{steps.filter((step) => step.status === "pending" || step.status === "requested").length}개</span>
        </article>
      </div>
      <div className="approval-step-list">
        {steps.map((step) => <ApprovalStepCard key={step.id} step={step} />)}
      </div>
    </section>
  );
}
