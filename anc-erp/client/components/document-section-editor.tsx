import type { SafetyReportSection } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type DocumentSectionEditorProps = {
  section: SafetyReportSection;
};

export function DocumentSectionEditor({ section }: DocumentSectionEditorProps) {
  return (
    <section className="panel report-section-editor">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">DocumentSectionEditor</p>
          <h3 className="panel-title">{section.title}</h3>
        </div>
        <StatusBadge tone="info" label={section.status} />
      </div>
      <div className="report-section-meta">
        <div className="kv-card">
          <strong>section key</strong>
          <span>{section.key}</span>
        </div>
        <div className="kv-card">
          <strong>updatedAt</strong>
          <span>{section.updatedAt.slice(0, 10)}</span>
        </div>
        <div className="kv-card">
          <strong>source links</strong>
          <span>{section.sourceEntityRefs.length}건</span>
        </div>
      </div>
      <div className="ops-card-list report-section-content-list">
        {Object.entries(section.content).map(([key, value]) => (
          <article className="ops-item" key={key}>
            <strong>{key}</strong>
            <span>{String(value)}</span>
          </article>
        ))}
      </div>
      {section.sourceEntityRefs.length > 0 ? (
        <div className="report-source-link-list">
          {section.sourceEntityRefs.map((source) => (
            <article className="ops-item" key={source.id}>
              <strong>{source.sourceLabel}</strong>
              <span>
                {source.sourceEntityType} · {source.sourceEntityId}
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
