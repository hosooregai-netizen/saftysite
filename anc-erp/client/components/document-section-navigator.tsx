"use client";

import type { SafetyReportSection } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type DocumentSectionNavigatorProps = {
  sections: SafetyReportSection[];
  activeSectionKey: string;
  onSelect: (sectionKey: string) => void;
};

export function DocumentSectionNavigator({
  sections,
  activeSectionKey,
  onSelect,
}: DocumentSectionNavigatorProps) {
  return (
    <section className="panel report-section-nav">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">DocumentSectionNavigator</p>
          <h3 className="panel-title">섹션 이동</h3>
        </div>
      </div>
      <div className="report-section-nav-list">
        {sections.map((section) => (
          <button
            className={section.key === activeSectionKey ? "report-section-chip active" : "report-section-chip"}
            key={section.id}
            onClick={() => onSelect(section.key)}
            type="button"
          >
            <span>{section.title}</span>
            <StatusBadge tone="info" label={section.status} />
          </button>
        ))}
      </div>
    </section>
  );
}
