"use client";

import { useState } from "react";

import { regenerateSafetyReportSectionDraft } from "../lib/safety-report-actions";
import { StatusBadge } from "./status-badge";

type SectionRegenerateButtonProps = {
  documentId: string;
  sectionKey: string;
};

export function SectionRegenerateButton({
  documentId,
  sectionKey,
}: SectionRegenerateButtonProps) {
  const [done, setDone] = useState(false);

  async function handleRegenerate() {
    await regenerateSafetyReportSectionDraft(documentId, sectionKey);
    setDone(true);
  }

  return (
    <div className="chip-row">
      <button className="secondary-button" onClick={handleRegenerate} type="button">
        재생성
      </button>
      {done ? <StatusBadge tone="success" label="완료" /> : null}
    </div>
  );
}
