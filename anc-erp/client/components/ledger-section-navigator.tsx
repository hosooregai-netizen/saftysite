import type { SafetyHealthLedgerSection } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function LedgerSectionNavigator({
  sections,
  activeKey,
  onChange,
}: {
  sections: SafetyHealthLedgerSection[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <section className="panel report-page-nav">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerSectionNavigator</p>
          <h3 className="panel-title">대장 섹션 이동</h3>
        </div>
      </div>
      <div className="report-page-nav-list">
        {sections.map((section) => (
          <button
            className={section.key === activeKey ? "quick-link report-page-link active" : "quick-link report-page-link"}
            key={section.key}
            onClick={() => onChange(section.key)}
            type="button"
          >
            <span>{section.title}</span>
            <StatusBadge
              label={section.status}
              tone={
                section.status === "edited"
                  ? "info"
                  : section.status === "review"
                    ? "review"
                    : "neutral"
              }
            />
          </button>
        ))}
      </div>
    </section>
  );
}
