import { ErpShell } from "../../../components/erp-shell";
import { ApprovalActionPanel } from "../../../components/approval-action-panel";
import { ApprovalCommentThread } from "../../../components/approval-comment-thread";
import { ApprovalStatusBadge } from "../../../components/approval-status-badge";
import { ApprovalStepper } from "../../../components/approval-stepper";
import { ApprovalWorkflowCard } from "../../../components/approval-workflow-card";
import { ChangeRequestPanel } from "../../../components/change-request-panel";
import { loadApprovalWorkflowPageData } from "../../../lib/approval-page-data";

type ApprovalWorkflowPageProps = {
  params: Promise<{ approvalWorkflowId: string }>;
};

export default async function ApprovalWorkflowPage({ params }: ApprovalWorkflowPageProps) {
  const { approvalWorkflowId } = await params;
  const pageData = await loadApprovalWorkflowPageData(approvalWorkflowId);
  const currentStep = pageData.detail.steps.find((step) => step.status === "current");

  return (
    <ErpShell title={`Approval Workflow: ${approvalWorkflowId}`} subtitle="개별 workflow 추적 화면입니다.">
      <ApprovalWorkflowCard detail={pageData.detail} />
      {pageData.detail.workflow ? <ApprovalStatusBadge status={pageData.detail.workflow.status} /> : null}
      <section className="approval-workspace-layout">
        <div className="section-stack">
          <ApprovalStepper steps={pageData.detail.steps} />
        </div>
        <div className="section-stack">
          <ApprovalCommentThread comments={pageData.detail.comments} />
        </div>
        <div className="section-stack">
          <ApprovalActionPanel documentId={pageData.detail.document.id} workflowId={pageData.detail.workflow?.id} currentStepId={currentStep?.id} />
          <ChangeRequestPanel currentStepId={currentStep?.id} />
        </div>
      </section>
    </ErpShell>
  );
}
