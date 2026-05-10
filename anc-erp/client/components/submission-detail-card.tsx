import type { SubmissionDetailResponse } from "../../packages/contracts/src";
import { SubmissionStatusBadge } from "./submission-status-badge";

type SubmissionDetailCardProps = {
  detail: SubmissionDetailResponse;
};

export function SubmissionDetailCard({ detail }: SubmissionDetailCardProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionDetailCard</p>
          <h3 className="panel-title">{detail.document.title}</h3>
        </div>
        <SubmissionStatusBadge status={detail.submission.status} />
      </div>
      <div className="approval-summary-grid approval-summary-grid-tight">
        <article className="ops-item">
          <strong>submissionId</strong>
          <span>{detail.submission.id}</span>
        </article>
        <article className="ops-item">
          <strong>ownerPartyId</strong>
          <span>{detail.submission.ownerPartyId}</span>
        </article>
        <article className="ops-item">
          <strong>channel</strong>
          <span>{detail.submission.channel ?? "미지정"}</span>
        </article>
      </div>
    </section>
  );
}
