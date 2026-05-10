import type { ApprovalWorkflowDetailResponse } from "../../packages/contracts/src";
import { ApprovalStatusBadge } from "./approval-status-badge";

type ApprovalWorkflowCardProps = {
  detail: ApprovalWorkflowDetailResponse;
};

export function ApprovalWorkflowCard({ detail }: ApprovalWorkflowCardProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ApprovalWorkflowCard</p>
          <h3 className="panel-title">{detail.document.title}</h3>
          <p className="card-copy">문서 단위 approval workflow의 현재 상태와 owner 문맥 요약입니다.</p>
        </div>
        {detail.workflow ? <ApprovalStatusBadge status={detail.workflow.status} /> : null}
      </div>
      <div className="approval-summary-grid approval-summary-grid-tight">
        <article className="ops-item">
          <strong>documentId</strong>
          <span>{detail.document.id}</span>
        </article>
        <article className="ops-item">
          <strong>workflowId</strong>
          <span>{detail.workflow?.id ?? "미생성"}</span>
        </article>
        <article className="ops-item">
          <strong>ownerPartyId</strong>
          <span>{detail.document.ownerPartyId}</span>
        </article>
      </div>
    </section>
  );
}
