import type { SubmissionRecipient } from "../../packages/contracts/src";

type SubmissionRecipientTableProps = {
  recipients: SubmissionRecipient[];
};

export function SubmissionRecipientTable({ recipients }: SubmissionRecipientTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Submission Recipients</p>
          <h3 className="panel-title">수신자</h3>
          <p className="card-copy">ownerParty 정합성과 기관/역할 누락 여부를 점검하는 수신자 표입니다.</p>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>이름</span>
          <span>이메일</span>
          <span>기관</span>
        </div>
        {recipients.map((recipient) => (
          <div className="table-row" key={recipient.id}>
            <span className="approval-table-document">
              <strong>{recipient.name}</strong>
              <small>{recipient.roleLabel ?? "역할 미지정"}</small>
            </span>
            <span className="approval-table-document">
              <strong>{recipient.email}</strong>
              <small>{recipient.ownerPartyId ?? "owner 미지정"}</small>
            </span>
            <span className="approval-table-document">
              <strong>{recipient.organizationName ?? "미지정"}</strong>
              <small>{recipient.createdAt}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
