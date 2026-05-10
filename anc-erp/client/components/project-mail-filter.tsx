export function ProjectMailFilter({ projectId }: { projectId?: string | null }) {
  return (
    <section className="panel mailbox-filter-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Containment</p>
          <h3 className="panel-title">Project Linkage</h3>
        </div>
        <span className={`status ${projectId ? "submitted" : "warning"}`}>{projectId ? "project linked" : "global view"}</span>
      </div>
      <p className="muted">{projectId ? `projectId: ${projectId}` : "전역 메일함 보기"}</p>
      <div className="mailbox-flag-list">
        <span className="pill outline">document / submission trace</span>
        <span className="pill outline">attachment save review</span>
      </div>
    </section>
  );
}
