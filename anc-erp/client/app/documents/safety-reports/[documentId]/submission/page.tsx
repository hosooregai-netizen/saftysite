import { ErpShell } from "../../../../../components/erp-shell";
import { MailDraftButton } from "../../../../../components/mail-draft-button";
import { SubmittedFileCard } from "../../../../../components/submitted-file-card";
import { SubmissionHistory } from "../../../../../components/submission-history";
import { StatusBadge } from "../../../../../components/status-badge";
import { loadSafetyReportDetailPageData } from "../../../../../lib/safety-report-page-data";

type SafetyReportSubmissionPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyReportSubmissionPage({
  params,
}: SafetyReportSubmissionPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportDetailPageData(documentId);

  return (
    <ErpShell
      title={`제출 · ${documentId}`}
      subtitle="exportedFileId, mailThreadId, submission linkage를 DocumentInstance 내부에서 관리합니다."
    >
      <div className="section-stack">
        <section className="hero-card report-submission-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Submission Workspace</p>
              <h2 className="hero-title">최종본 전달 및 제출 연결</h2>
              <p className="hero-subtitle">
                export 파일, 메일 thread, submission linkage를 함께 관리해 DocumentInstance와 제출흐름이 분리되지 않게 유지합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge
                tone={pageData.detail.document.exportedFileId ? "success" : "warning"}
                label={pageData.detail.document.exportedFileId ? "export 완료" : "export 필요"}
              />
            </div>
          </div>
        </section>
      </div>
      <section className="feature-split">
        <div className="section-stack">
          <SubmittedFileCard file={pageData.detail.exportedFile} />
          <SubmissionHistory detail={pageData.detail} />
        </div>
        <div className="section-stack">
          <MailDraftButton documentId={documentId} />
        </div>
      </section>
    </ErpShell>
  );
}
