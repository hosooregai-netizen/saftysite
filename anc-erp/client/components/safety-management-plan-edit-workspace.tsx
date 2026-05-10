"use client";

import { useState } from "react";

import type { SafetyManagementPlanSection } from "../../packages/contracts/src";
import { PlanA4Preview } from "./plan-a4-preview";
import { PlanSaveBar } from "./plan-save-bar";
import { PlanSectionEditor } from "./plan-section-editor";
import { PlanSectionNavigator } from "./plan-section-navigator";
import { PlanSectionRegenerateButton } from "./plan-section-regenerate-button";

export function SafetyManagementPlanEditWorkspace({
  planId,
  sections,
}: {
  planId: string;
  sections: SafetyManagementPlanSection[];
}) {
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "cover");
  const [draftSections, setDraftSections] = useState(sections);
  const activeSection = draftSections.find((item) => item.key === activeKey) ?? draftSections[0];

  if (!activeSection) {
    return null;
  }

  function updateActiveSectionContent(content: SafetyManagementPlanSection["content"]) {
    setDraftSections((current) =>
      current.map((item) =>
        item.key === activeKey
          ? {
              ...item,
              content,
            }
          : item,
      ),
    );
  }

  return (
    <div className="report-workspace-layout">
      <div className="report-side-stack">
        <PlanSectionNavigator sections={draftSections} activeKey={activeKey} onChange={setActiveKey} />
      </div>
      <div className="report-center-stack">
        <PlanSectionEditor onChange={updateActiveSectionContent} section={activeSection} />
        <section className="panel report-actions-panel">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">PlanSaveBar</p>
              <h3 className="panel-title">편집 액션</h3>
            </div>
          </div>
          <div className="inline-actions">
            <PlanSaveBar planId={planId} section={activeSection} />
            <PlanSectionRegenerateButton planId={planId} sectionKey={activeSection.key} />
          </div>
        </section>
      </div>
      <div className="report-side-stack">
        <PlanA4Preview sections={draftSections} />
      </div>
    </div>
  );
}
