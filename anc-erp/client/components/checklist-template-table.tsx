import type { ChecklistTemplate } from "../../packages/contracts/src";
import { ChecklistVersionBadge } from "./checklist-version-badge";

export function ChecklistTemplateTable({ templates }: { templates: ChecklistTemplate[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistTemplateTable</p>
          <h3>체크리스트 템플릿</h3>
        </div>
      </div>
      <div className="section-stack">
        {templates.map((template) => (
          <article className="inspection-action-item" key={template.id}>
            <div>
              <strong>{template.name}</strong>
              <span>{template.description ?? "설명 없음"}</span>
            </div>
            <div className="badge-row">
              <ChecklistVersionBadge version={template.version} />
              <span className="pill">{template.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
