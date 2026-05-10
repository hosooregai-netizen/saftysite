export function FindingMailTable({ findingIds }: { findingIds: string[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FindingMailTable</p>
          <h3 className="panel-title">조치 요청 대상 지적사항</h3>
        </div>
        <span className="status review">{findingIds.length}건</span>
      </div>
      <div className="stack-list">
        {findingIds.length === 0 ? <p className="empty-state">연결된 지적사항이 없습니다.</p> : null}
        {findingIds.map((findingId, index) => (
          <article className="mini-card" key={findingId}>
            <strong>{index + 1}. {findingId}</strong>
            <p className="muted">Finding linked action-request mail 대상입니다.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
