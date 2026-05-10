import { ErpShell } from "../../../components/erp-shell";
import { ApprovalStatusBadge } from "../../../components/approval-status-badge";
import { MailSubmissionLinkCard } from "../../../components/mail-submission-link-card";
import { SubmissionAttachmentTable } from "../../../components/submission-attachment-table";
import { SubmissionDetailCard } from "../../../components/submission-detail-card";
import { SubmissionHistoryTimeline } from "../../../components/submission-history-timeline";
import { SubmissionMailDraftPanel } from "../../../components/submission-mail-draft-panel";
import { SubmissionRecipientTable } from "../../../components/submission-recipient-table";
import { WebhardFinalFileCard } from "../../../components/webhard-final-file-card";
import { loadSubmissionDetailPageData } from "../../../lib/approval-page-data";

type SubmissionDetailPageProps = {
  params: Promise<{ submissionId: string }>;
};

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { submissionId } = await params;
  const pageData = await loadSubmissionDetailPageData(submissionId);

  return (
    <ErpShell title={`Submission: ${submissionId}`} subtitle="제출 이력 상세 화면입니다.">
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Submission Detail</p>
            <h2 className="hero-title">{pageData.detail.document.title}</h2>
            <p className="hero-subtitle">제출 단위의 최종 파일, 메일 thread, 수신자, 첨부, 이력을 하나의 패키지로 검토합니다.</p>
          </div>
          <ApprovalStatusBadge status={pageData.detail.submission.status} />
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>submissionId</span>
            <strong>{pageData.detail.submission.id}</strong>
          </article>
          <article className="hero-summary-card">
            <span>ownerPartyId</span>
            <strong>{pageData.detail.submission.ownerPartyId}</strong>
          </article>
          <article className="hero-summary-card">
            <span>channel</span>
            <strong>{pageData.detail.submission.channel ?? "미지정"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>submittedAt</span>
            <strong>{pageData.detail.submission.submittedAt}</strong>
          </article>
        </div>
      </section>
      <section className="approval-workspace-layout">
        <div className="section-stack">
          <SubmissionDetailCard detail={pageData.detail} />
          <WebhardFinalFileCard fileId={pageData.detail.submission.finalFileId ?? pageData.detail.submission.exportedFileId} />
          <MailSubmissionLinkCard mailThreadId={pageData.detail.submission.mailThreadId} />
          <SubmissionMailDraftPanel submissionId={pageData.detail.submission.id} />
        </div>
        <div className="section-stack">
          <SubmissionRecipientTable recipients={pageData.detail.recipients} />
          <SubmissionAttachmentTable attachments={pageData.detail.attachments} />
        </div>
        <div className="section-stack">
          <SubmissionHistoryTimeline events={pageData.detail.events} />
        </div>
      </section>
    </ErpShell>
  );
}
