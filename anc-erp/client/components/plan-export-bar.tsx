"use client";

import { useState } from "react";

import { exportSafetyManagementPlanDraft } from "../lib/safety-management-plan-actions";
import { ExportFormatSelector } from "./export-format-selector";
import { WebhardSaveLocation } from "./webhard-save-location";

export function PlanExportBar({ planId, path }: { planId: string; path?: string | null }) {
  const [format, setFormat] = useState("pdf");

  async function handleExport() {
    await exportSafetyManagementPlanDraft(planId, {});
  }

  return (
    <div className="section-stack compact">
      <ExportFormatSelector onChange={setFormat} value={format} />
      <WebhardSaveLocation path={path} />
      <div className="inline-actions">
        <button className="primary-button" onClick={handleExport} type="button">
          최종본 export
        </button>
        <span className="helper-text">최신 저장 snapshot과 첨부 연결 상태를 먼저 확인합니다.</span>
      </div>
    </div>
  );
}
