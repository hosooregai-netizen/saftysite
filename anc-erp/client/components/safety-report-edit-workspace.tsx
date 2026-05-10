"use client";

import { useMemo, useState } from "react";

import type { MissingField, SafetyReportSection } from "../../packages/contracts/src";
import { A4ReportPreview } from "./a4-report-preview";
import { DocumentSectionEditor } from "./document-section-editor";
import { DocumentSectionNavigator } from "./document-section-navigator";
import { MissingFieldPanel } from "./missing-field-panel";
import { ReportSaveBar } from "./report-save-bar";

type SafetyReportEditWorkspaceProps = {
  documentId: string;
  sections: SafetyReportSection[];
  missingFields: MissingField[];
};

export function SafetyReportEditWorkspace({
  documentId,
  sections,
  missingFields,
}: SafetyReportEditWorkspaceProps) {
  const [activeSectionKey, setActiveSectionKey] = useState(sections[0]?.key ?? "");
  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeSectionKey) ?? sections[0],
    [activeSectionKey, sections],
  );

  if (!activeSection) {
    return null;
  }

  return (
    <section className="report-workspace-layout">
      <div className="section-stack report-side-stack">
        <DocumentSectionNavigator
          activeSectionKey={activeSectionKey}
          onSelect={setActiveSectionKey}
          sections={sections}
        />
        <MissingFieldPanel
          title="편집 중 함께 보는 누락정보"
          items={missingFields.slice(0, 6).map((item) => ({
            label: item.label ?? item.field,
            reason: item.reason ?? item.message,
            severity: item.severity === "required" ? "required" : "recommended",
          }))}
        />
      </div>
      <div className="section-stack report-center-stack">
        <DocumentSectionEditor section={activeSection} />
        <ReportSaveBar documentId={documentId} section={activeSection} />
      </div>
      <div className="section-stack report-side-stack">
        <A4ReportPreview sections={sections} />
      </div>
    </section>
  );
}
