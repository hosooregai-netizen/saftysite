import type { SafetyReportDetailResponse } from "../../packages/contracts/src";

type SubmissionHistoryProps = {
  detail: SafetyReportDetailResponse;
};

export function SubmissionHistory({ detail }: SubmissionHistoryProps) {
  return (
    <section className="panel report-submission-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionHistory</p>
          <h3 className="panel-title">제출 이력</h3>
        </div>
      </div>
      <div className="report-submission-grid">
        <article className="ops-item">
          <strong>exportedFileId</strong>
          <span>{detail.document.exportedFileId ?? "미생성"}</span>
        </article>
        <article className="ops-item">
          <strong>submittedAt</strong>
          <span>{detail.document.submittedAt ?? "미제출"}</span>
        </article>
        <article className="ops-item">
          <strong>mailThreadId</strong>
          <span>{detail.document.mailThreadId ?? "미연결"}</span>
        </article>
        <article className="ops-item">
          <strong>submissionId</strong>
          <span>{detail.document.submissionId ?? "미연결"}</span>
        </article>
      </div>
    </section>
  );
}
