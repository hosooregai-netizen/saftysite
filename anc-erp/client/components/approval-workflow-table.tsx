import Link from "next/link";

import type { ApprovalListItem } from "../../packages/contracts/src";
import { ApprovalStatusBadge } from "./approval-status-badge";

type ApprovalWorkflowTableProps = {
  items: ApprovalListItem[];
};

export function ApprovalWorkflowTable({ items }: ApprovalWorkflowTableProps) {
  const requestedCount = items.filter((item) => item.workflow.status === "requested").length;
  const reviewCount = items.filter((item) => item.workflow.status === "in_review").length;
  const blockedCount = items.filter((item) => item.pendingRequiredCount > 0).length;

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Approval Queue</p>
          <h3 className="panel-title">전역 결재 큐</h3>
          <p className="card-copy">문서 내부 결재선을 기준으로 현재 담당자, 필수 미완료 단계, owner 문맥을 빠르게 확인합니다.</p>
        </div>
      </div>
      <div className="approval-summary-grid">
        <article className="ops-item">
          <strong>전체 workflow</strong>
          <span>{items.length}건</span>
        </article>
        <article className="ops-item">
          <strong>결재 요청 대기</strong>
          <span>{requestedCount}건</span>
        </article>
        <article className="ops-item">
          <strong>검토 진행 중</strong>
          <span>{reviewCount}건</span>
        </article>
        <article className="ops-item">
          <strong>필수 단계 잔여</strong>
          <span>{blockedCount}건</span>
        </article>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>문서</span>
          <span>상태</span>
          <span>현재 단계</span>
          <span>미완료 필수 단계</span>
        </div>
        {items.map((item) => (
          <Link
            className="table-row table-link-row"
            key={item.workflow.id}
            href={`/approvals/${item.workflow.id}`}
          >
            <span className="approval-table-document">
              <strong>{item.document.title}</strong>
              <small>{item.document.id}</small>
            </span>
            <span><ApprovalStatusBadge status={item.workflow.status} /></span>
            <span className="approval-table-document">
              <strong>{item.currentStep?.assigneeLabel ?? "대기"}</strong>
              <small>{item.currentStep?.role ?? "미배정"}</small>
            </span>
            <span className="approval-table-document">
              <strong>{item.pendingRequiredCount}건</strong>
              <small>{item.document.ownerPartyId}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
