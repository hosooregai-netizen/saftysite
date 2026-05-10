export function MailBodyViewer({ body }: { body?: string | null }) {
  return (
    <section className="panel">
      <p className="card-eyebrow">Mail Body</p>
      <pre className="document-preview" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
        {body || "본문이 없습니다."}
      </pre>
    </section>
  );
}
