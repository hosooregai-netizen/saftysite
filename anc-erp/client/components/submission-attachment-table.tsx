import type { SubmissionAttachment } from "../../packages/contracts/src";

type SubmissionAttachmentTableProps = {
  attachments: SubmissionAttachment[];
};

export function SubmissionAttachmentTable({ attachments }: SubmissionAttachmentTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Submission Attachments</p>
          <h3 className="panel-title">제출 첨부</h3>
          <p className="card-copy">주파일 외 증빙, 첨부, 수신용 파일을 패키지 관점에서 정리합니다.</p>
        </div>
      </div>
      <div className="approval-summary-grid">
        <article className="ops-item">
          <strong>첨부 수</strong>
          <span>{attachments.length}건</span>
        </article>
        <article className="ops-item">
          <strong>attachmentType</strong>
          <span>{new Set(attachments.map((attachment) => attachment.attachmentType)).size}종</span>
        </article>
      </div>
      <div className="stack-list">
        {attachments.map((attachment) => (
          <article className="ops-item" key={attachment.id}>
            <strong>{attachment.label}</strong>
            <span>{attachment.attachmentType}</span>
            <span>{attachment.fileId}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
