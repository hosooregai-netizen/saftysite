import { ErpShell } from "../../components/erp-shell";
import { ApprovalStatusBadge } from "../../components/approval-status-badge";
import { ApprovalWorkflowTable } from "../../components/approval-workflow-table";
import { loadApprovalsQueuePageData } from "../../lib/approval-page-data";

export default async function ApprovalsPage() {
  const pageData = await loadApprovalsQueuePageData();
  const inReviewCount = pageData.items.filter((item) => item.workflow.status === "in_review").length;
  const requestedCount = pageData.items.filter((item) => item.workflow.status === "requested").length;
  const blockedCount = pageData.items.filter((item) => item.pendingRequiredCount > 0).length;

  return (
    <ErpShell
      title="Approvals Queue"
      subtitle="전역 결재함은 queue 역할만 하고, 실제 approval workflow는 DocumentInstance 내부에 유지됩니다."
    >
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Approval Control Queue</p>
            <h2 className="hero-title">결재 대기와 문서 차단 사유를 한 번에 보는 전역 결재함</h2>
            <p className="hero-subtitle">
              이 화면은 독립 결재 앱이 아니라 문서별 approval workflow를 모아 보여주는 queue입니다.
              현재 단계 담당자와 필수 단계 잔여 건수를 우선 확인하도록 구성합니다.
            </p>
          </div>
          <div className="status-stack">
            <ApprovalStatusBadge status="in_review" />
            <ApprovalStatusBadge status="requested" />
            <ApprovalStatusBadge status="approved" />
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>전체 workflow</span>
            <strong>{pageData.items.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>검토 진행 중</span>
            <strong>{inReviewCount}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>결재 요청 대기</span>
            <strong>{requestedCount}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>필수 단계 잔여</span>
            <strong>{blockedCount}건</strong>
          </article>
        </div>
      </section>
      <ApprovalWorkflowTable items={pageData.items} />
    </ErpShell>
  );
}
