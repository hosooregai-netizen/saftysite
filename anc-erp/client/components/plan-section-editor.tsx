import type { SafetyManagementPlanSection } from "../../packages/contracts/src";

export function PlanSectionEditor({
  section,
  onChange,
}: {
  section: SafetyManagementPlanSection;
  onChange: (content: SafetyManagementPlanSection["content"]) => void;
}) {
  function updateValue(key: string, value: string) {
    onChange({
      ...section.content,
      [key]: value,
    });
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanSectionEditor</p>
          <h3 className="panel-title">{section.title}</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {Object.entries(section.content).map(([key, value]) => (
          <article className="ops-item" key={key}>
            <strong>{key}</strong>
            {typeof value === "string" ? (
              <textarea
                className="fake-input"
                onChange={(event) => updateValue(key, event.target.value)}
                rows={key === "summary" ? 4 : 2}
                value={value}
              />
            ) : (
              <span>{String(value)}</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
