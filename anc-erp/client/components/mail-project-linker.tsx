export function MailProjectLinker({ projectId }: { projectId?: string | null }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Project Link</p>
          <h3 className="panel-title">프로젝트 연결 상태</h3>
        </div>
        <span className={`status ${projectId ? "submitted" : "warning"}`}>{projectId ? "확정" : "미분류"}</span>
      </div>
      <p className="muted">{projectId ? `projectId: ${projectId}` : "project linkage not resolved"}</p>
      <div className="mailbox-flag-list">
        <span className="pill outline">document trace</span>
        <span className="pill outline">submission trace</span>
      </div>
    </section>
  );
}
