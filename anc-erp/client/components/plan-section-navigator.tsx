"use client";

import type { SafetyManagementPlanSection } from "../../packages/contracts/src";

export function PlanSectionNavigator({
  sections,
  activeKey,
  onChange,
}: {
  sections: SafetyManagementPlanSection[];
  activeKey: string;
  onChange: (key: SafetyManagementPlanSection["key"]) => void;
}) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanSectionNavigator</p>
          <h3 className="panel-title">섹션 이동</h3>
        </div>
      </div>
      <div className="chip-row">
        {sections.map((section) => (
          <button
            className={`micro-pill ${section.key === activeKey ? "active" : ""}`}
            key={section.id}
            onClick={() => onChange(section.key)}
            type="button"
          >
            {section.title}
          </button>
        ))}
      </div>
    </section>
  );
}
