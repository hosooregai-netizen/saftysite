import { ApprovalStatusBadge } from "../../../../components/approval-status-badge";
import { ErpShell } from "../../../../components/erp-shell";
import { MailSubmissionLinkCard } from "../../../../components/mail-submission-link-card";
import { SubmissionDetailCard } from "../../../../components/submission-detail-card";
import { SubmissionMailDraftPanel } from "../../../../components/submission-mail-draft-panel";
import { SubmissionPackageBuilder } from "../../../../components/submission-package-builder";
import { SubmissionAttachmentTable } from "../../../../components/submission-attachment-table";
import { SubmissionHistoryTimeline } from "../../../../components/submission-history-timeline";
import { SubmissionReadinessPanel } from "../../../../components/submission-readiness-panel";
import { SubmissionRecipientTable } from "../../../../components/submission-recipient-table";
import { WebhardFinalFileCard } from "../../../../components/webhard-final-file-card";
import { loadDocumentSubmissionPageData } from "../../../../lib/approval-page-data";

type DocumentSubmissionPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentSubmissionPage({
  params,
}: DocumentSubmissionPageProps) {
  const { documentId } = await params;
  const pageData = await loadDocumentSubmissionPageData(documentId);

  return (
    <ErpShell
      title={`Submission: ${documentId}`}
      subtitle="제출은 최종 파일, 메일, 이력이 연결된 DocumentInstance 단계입니다."
    >
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Submission Control</p>
            <h2 className="hero-title">{pageData.readiness.document.title}</h2>
            <p className="hero-subtitle">
              제출은 결재·서명·패키지·수신자·메일 thread가 모두 맞물리는 문서 최종 통제 단계입니다.
            </p>
          </div>
          <ApprovalStatusBadge status={pageData.readiness.ready ? "approved" : "changes_requested"} />
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>ownerPartyId</span>
            <strong>{pageData.readiness.document.ownerPartyId}</strong>
          </article>
          <article className="hero-summary-card">
            <span>mainFileId</span>
            <strong>{pageData.readiness.package?.mainFileId ?? "미연결"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>mailThreadId</span>
            <strong>{pageData.submission?.submission.mailThreadId ?? pageData.readiness.document.mailThreadId ?? "미연결"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>submission status</span>
            <strong>{pageData.submission?.submission.status ?? "draft 전"}</strong>
          </article>
        </div>
      </section>
      <section className="approval-workspace-layout">
        <div className="section-stack">
          <SubmissionReadinessPanel readiness={pageData.readiness} />
          <SubmissionPackageBuilder
            documentId={documentId}
            mainFileId={pageData.readiness.package?.mainFileId ?? pageData.readiness.document.exportedFileId}
            packageId={pageData.readiness.package?.id}
          />
          {pageData.submission ? <SubmissionHistoryTimeline events={pageData.submission.events} /> : null}
        </div>
        <div className="section-stack">
          {pageData.submission ? <SubmissionDetailCard detail={pageData.submission} /> : null}
          <WebhardFinalFileCard fileId={pageData.readiness.package?.mainFileId ?? pageData.readiness.document.exportedFileId} />
          <MailSubmissionLinkCard mailThreadId={pageData.submission?.submission.mailThreadId ?? pageData.readiness.document.mailThreadId} />
          <SubmissionMailDraftPanel submissionId={pageData.submission?.submission.id} />
          {pageData.submission ? (
            <>
              <SubmissionRecipientTable recipients={pageData.submission.recipients} />
              <SubmissionAttachmentTable attachments={pageData.submission.attachments} />
            </>
          ) : (
            <section className="panel">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Submission Draft</p>
                  <h3 className="panel-title">제출 이력 없음</h3>
                </div>
              </div>
              <p className="card-copy">submission package 생성 후 `/api/v1/projects/{`{projectId}`}/submissions` 경로로 제출 draft를 만듭니다.</p>
            </section>
          )}
        </div>
        <div className="section-stack">
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">A4 Review Note</p>
                <h3 className="panel-title">제출 전 문서 검토 포인트</h3>
              </div>
            </div>
            <div className="stack-list">
              <article className="ops-item">
                <strong>최종본/날인본 분리</strong>
                <span>exportedFileId, signed file, 첨부파일이 서로 다른 역할로 유지되어야 합니다.</span>
              </article>
              <article className="ops-item">
                <strong>owner-specific 제출</strong>
                <span>{pageData.readiness.document.ownerPartyId} 기준 수신자와 제출 package를 확인합니다.</span>
              </article>
              <article className="ops-item">
                <strong>메일/웹하드 linkage</strong>
                <span>메일 thread, final file, package 상태가 모두 연결되어야 receipt 추적이 가능합니다.</span>
              </article>
            </div>
          </section>
        </div>
      </section>
    </ErpShell>
  );
}
