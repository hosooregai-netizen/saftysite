import Link from "next/link";

import { OwnerSubmissionMatrix } from "../../../../components/owner-submission-matrix";
import { ErpShell } from "../../../../components/erp-shell";
import { ApprovalStatusBadge } from "../../../../components/approval-status-badge";
import { SubmissionHistoryTable } from "../../../../components/submission-history-table";
import { loadProjectSubmissionsPageData } from "../../../../lib/approval-page-data";

type ProjectSubmissionsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSubmissionsPage({ params }: ProjectSubmissionsPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectSubmissionsPageData(projectId);

  return (
    <ErpShell title={`Submissions: ${projectId}`} subtitle="프로젝트 제출 큐는 DocumentInstance 제출 이력의 목록 화면입니다.">
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Project Submission Queue</p>
            <h2 className="hero-title">프로젝트 제출 이력과 발주처 제출 흐름</h2>
            <p className="hero-subtitle">
              이 화면은 독립 제출 앱이 아니라 DocumentInstance 제출 이력을 프로젝트 단위로 모아 보는 큐입니다.
            </p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>submission count</span>
            <strong>{pageData.items.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>submitted</span>
            <strong>{pageData.items.filter((item) => item.submission.status === "submitted").length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>receipt confirmed</span>
            <strong>{pageData.items.filter((item) => item.submission.receiptConfirmedAt).length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>revision requested</span>
            <strong>{pageData.items.filter((item) => item.submission.revisionRequestedAt).length}건</strong>
          </article>
        </div>
      </section>
      <OwnerSubmissionMatrix items={pageData.items} />
      <SubmissionHistoryTable items={pageData.items} />
      <section className="panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Project Submissions</p>
            <h3 className="panel-title">제출 큐</h3>
            <p className="card-copy">문서별 제출 상태와 ownerParty 분기를 함께 확인하는 dense queue입니다.</p>
          </div>
        </div>
        <div className="data-table">
          <div className="table-row table-head">
            <span>submissionId</span>
            <span>documentId</span>
            <span>status</span>
          </div>
          {pageData.items.map((item) => (
            <Link className="table-row table-link-row" href={`/submissions/${item.submission.id}`} key={item.submission.id}>
              <span className="approval-table-document">
                <strong>{item.submission.id}</strong>
                <small>{item.submission.ownerPartyId}</small>
              </span>
              <span className="approval-table-document">
                <strong>{item.submission.documentId}</strong>
                <small>{item.submission.finalFileId ?? item.submission.exportedFileId}</small>
              </span>
              <span><ApprovalStatusBadge status={item.submission.status} /></span>
            </Link>
          ))}
        </div>
      </section>
    </ErpShell>
  );
}
