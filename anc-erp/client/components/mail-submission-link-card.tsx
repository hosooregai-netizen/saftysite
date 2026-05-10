type MailSubmissionLinkCardProps = {
  mailThreadId?: string | null;
};

export function MailSubmissionLinkCard({ mailThreadId }: MailSubmissionLinkCardProps) {
  return (
    <section className="card submission-link-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Mail Link</p>
          <h3>제출 메일 thread</h3>
        </div>
        <span className="pill outline">{mailThreadId ? "thread linked" : "not sent"}</span>
      </div>
      <p className="card-copy">{mailThreadId ?? "메일 미연결"}</p>
      <p className="helper-text">제출 메일 thread는 submission history와 owner receipt 추적의 기준 링크입니다.</p>
    </section>
  );
}
