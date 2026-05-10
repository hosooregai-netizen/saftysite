import type { SafetyHealthLedgerSection } from "../../packages/contracts/src";

export function LedgerSectionEditor({
  section,
  onChange,
}: {
  section: SafetyHealthLedgerSection;
  onChange: (content: SafetyHealthLedgerSection["content"]) => void;
}) {
  function updateValue(key: string, value: string) {
    onChange({
      ...section.content,
      [key]: value,
    });
  }

  return (
    <section className="panel ledger-editor-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerSectionEditor</p>
          <h3 className="panel-title">{section.title}</h3>
          <p className="card-copy">AI 초안과 사용자가 보정한 누적 원장 본문을 구분해서 관리합니다.</p>
        </div>
      </div>
      <div className="ops-card-list ledger-editor-grid">
        {Object.entries(section.content).map(([key, value]) => (
          <article className="ops-item ledger-editor-item" key={key}>
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
