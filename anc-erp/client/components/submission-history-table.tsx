import Link from "next/link";

import type { Submission } from "../../packages/contracts/src";
import { SubmissionStatusBadge } from "./submission-status-badge";

type SubmissionHistoryTableProps = {
  items: Array<{ submission: Submission }>;
};

export function SubmissionHistoryTable({ items }: SubmissionHistoryTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionHistoryTable</p>
          <h3 className="panel-title">프로젝트 제출 이력 표</h3>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>submissionId</span>
          <span>documentId</span>
          <span>status</span>
        </div>
        {items.map((item) => (
          <Link className="table-row table-link-row" href={`/submissions/${item.submission.id}`} key={item.submission.id}>
            <span className="approval-table-document">
              <strong>{item.submission.id}</strong>
              <small>{item.submission.ownerPartyId}</small>
            </span>
            <span className="approval-table-document">
              <strong>{item.submission.documentId}</strong>
              <small>{item.submission.finalFileId ?? item.submission.exportedFileId}</small>
            </span>
            <span><SubmissionStatusBadge status={item.submission.status} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
