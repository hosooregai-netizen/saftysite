import type { ApprovalComment } from "../../packages/contracts/src";

type ApprovalCommentThreadProps = {
  comments: ApprovalComment[];
};

export function ApprovalCommentThread({ comments }: ApprovalCommentThreadProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Approval Comments</p>
          <h3 className="panel-title">결재 코멘트</h3>
          <p className="card-copy">반려·보완·승인 의견을 문서 컨텍스트 안에서 이어서 검토합니다.</p>
        </div>
      </div>
      <div className="submission-history-list">
        {comments.map((comment) => (
          <article className="submission-history-card" key={comment.id}>
            <div className="utility-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="approval-table-document">
                <strong>{comment.authorUserId}</strong>
                <small>{comment.stepId ?? "workflow comment"}</small>
              </div>
              <span className="pill outline">{comment.createdAt}</span>
            </div>
            <p className="helper-text">{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
