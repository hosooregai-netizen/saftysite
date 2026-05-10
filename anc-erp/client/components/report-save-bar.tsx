"use client";

import { useState } from "react";

import type { SafetyReportSection } from "../../packages/contracts/src";
import { saveSafetyReportSectionDraft } from "../lib/safety-report-actions";
import { StatusBadge } from "./status-badge";

type ReportSaveBarProps = {
  documentId: string;
  section: SafetyReportSection;
};

export function ReportSaveBar({ documentId, section }: ReportSaveBarProps) {
  const [savedVersion, setSavedVersion] = useState<string>("");

  async function handleSave() {
    const response = await saveSafetyReportSectionDraft(documentId, {
      sectionKey: section.key,
      content: section.content,
      status: "edited",
      changeSummary: `${section.title} 저장`,
    });
    setSavedVersion(response.version?.id ?? "saved");
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportSaveBar</p>
          <h3>섹션 저장</h3>
        </div>
        {savedVersion ? <StatusBadge tone="success" label={savedVersion} /> : null}
      </div>
      <button className="primary-button" onClick={handleSave} type="button">
        {section.title} 저장
      </button>
    </section>
  );
}

