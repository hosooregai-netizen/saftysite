export function PlanVariablePanel({ variables }: { variables: Record<string, unknown> }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanVariablePanel</p>
          <h3 className="panel-title">문서 변수</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {Object.entries(variables).map(([key, value]) => (
          <article className="ops-item" key={key}>
            <strong>{key}</strong>
            <span>{String(value ?? "-")}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
