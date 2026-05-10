import { ErpShell } from "../../../../components/erp-shell";
import { ApprovalActionPanel } from "../../../../components/approval-action-panel";
import { ApprovalCommentThread } from "../../../../components/approval-comment-thread";
import { ApprovalStatusBadge } from "../../../../components/approval-status-badge";
import { ApprovalStepper } from "../../../../components/approval-stepper";
import { loadDocumentApprovalPageData } from "../../../../lib/approval-page-data";

type DocumentApprovalPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentApprovalPage({
  params,
}: DocumentApprovalPageProps) {
  const { documentId } = await params;
  const pageData = await loadDocumentApprovalPageData(documentId);
  const currentStep = pageData.detail.steps.find((step) => step.stepOrder === pageData.detail.workflow?.currentStepOrder);

  return (
    <ErpShell
      title={`Approval: ${documentId}`}
      subtitle="결재는 전역 독립 앱이 아니라 DocumentInstance 내부 단계입니다."
    >
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Document Approval</p>
            <h2 className="hero-title">{pageData.detail.document.title}</h2>
            <p className="hero-subtitle">
              제출 readiness 전에 결재선 진행, 현재 담당자, owner 문맥, 문서 버전 상태를 먼저 검토하는 문서 통제 화면입니다.
            </p>
          </div>
          {pageData.detail.workflow ? <ApprovalStatusBadge status={pageData.detail.workflow.status} /> : null}
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>documentId</span>
            <strong>{pageData.detail.document.id}</strong>
          </article>
          <article className="hero-summary-card">
            <span>ownerPartyId</span>
            <strong>{pageData.detail.document.ownerPartyId}</strong>
          </article>
          <article className="hero-summary-card">
            <span>현재 단계</span>
            <strong>{currentStep?.assigneeLabel ?? "대기"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>templateId</span>
            <strong>{pageData.detail.workflow?.templateId ?? "미지정"}</strong>
          </article>
        </div>
        <div className="approval-summary-grid approval-summary-grid-tight">
          <article className="ops-item">
            <strong>inspectionRoundId</strong>
            <span>{pageData.detail.document.inspectionRoundId}</span>
          </article>
          <article className="ops-item">
            <strong>latestVersionNo</strong>
            <span>{pageData.detail.document.latestVersionNo ?? "미지정"}</span>
          </article>
          <article className="ops-item">
            <strong>document status</strong>
            <span>{pageData.detail.document.status}</span>
          </article>
        </div>
      </section>
      <section className="approval-workspace-layout">
        <div className="section-stack">
          <ApprovalStepper steps={pageData.detail.steps} />
        </div>
        <div className="section-stack">
          <ApprovalCommentThread comments={pageData.detail.comments} />
        </div>
        <div className="section-stack">
          <ApprovalActionPanel documentId={documentId} workflowId={pageData.detail.workflow?.id} />
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Document Preview Note</p>
                <h3 className="panel-title">문서 검토 포인트</h3>
              </div>
            </div>
            <div className="stack-list">
              <article className="ops-item">
                <strong>초안/검토본 구분</strong>
                <span>결재 중인 문서는 final submission 단계와 분리해 읽어야 합니다.</span>
              </article>
              <article className="ops-item">
                <strong>owner-specific 문맥</strong>
                <span>{pageData.detail.document.ownerPartyId} 기준 수신자, 서명, 제출본이 정렬되어야 합니다.</span>
              </article>
            </div>
          </section>
        </div>
      </section>
    </ErpShell>
  );
}
