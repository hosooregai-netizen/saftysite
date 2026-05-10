import type { SafetyManagementPlanSection } from "../../packages/contracts/src";

export function PlanA4Preview({ sections }: { sections: SafetyManagementPlanSection[] }) {
  return (
    <section className="panel a4-preview-shell report-preview-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanA4Preview</p>
          <h3 className="panel-title">A4 미리보기</h3>
        </div>
      </div>
      <div className="report-a4-frame">
        <div className="report-a4-strip">
          <span>문서 상태</span>
          <strong>Draft watermark / page break 검토</strong>
        </div>
        <div className="report-a4-strip">
          <span>페이지</span>
          <strong>1 / {Math.max(1, sections.length)}</strong>
        </div>
      </div>
      <div className="a4-preview-sheet plan-a4-sheet">
        <div className="plan-draft-watermark">AI DRAFT</div>
        {sections.map((section) => (
          <article className="preview-block" key={section.id}>
            <strong>{section.title}</strong>
            <p>{String(section.content.summary ?? section.content.title ?? "")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
