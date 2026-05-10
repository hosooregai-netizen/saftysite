"use client";

import { useState } from "react";

import { refreshSafetyReportLinkedDataDraft } from "../lib/safety-report-actions";
import { StatusBadge } from "./status-badge";

type RefreshLinkedDataButtonProps = {
  documentId: string;
};

export function RefreshLinkedDataButton({
  documentId,
}: RefreshLinkedDataButtonProps) {
  const [result, setResult] = useState<string>("");

  async function handleRefresh() {
    const response = await refreshSafetyReportLinkedDataDraft(documentId);
    setResult(`${response.warnings.length} warnings`);
  }

  return (
    <div className="report-inline-action">
      <button className="secondary-button" onClick={handleRefresh} type="button">
        linked data 새로고침
      </button>
      {result ? <StatusBadge tone="info" label={result} /> : null}
    </div>
  );
}
