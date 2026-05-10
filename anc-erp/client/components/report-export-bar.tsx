"use client";

import { useState } from "react";

import { exportSafetyReportDraft } from "../lib/safety-report-actions";
import { StatusBadge } from "./status-badge";
import { WebhardSaveLocation } from "./webhard-save-location";

type ReportExportBarProps = {
  documentId: string;
};

export function ReportExportBar({ documentId }: ReportExportBarProps) {
  const [path, setPath] = useState<string>("");

  async function handleExport() {
    const response = await exportSafetyReportDraft(documentId, {});
    setPath(response.fileAsset.storagePath);
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ReportExportBar</p>
          <h3 className="panel-title">최종본 생성</h3>
        </div>
        {path ? <StatusBadge tone="success" label="export 완료" /> : null}
      </div>
      <button className="primary-button" onClick={handleExport} type="button">
        최신 저장본으로 export
      </button>
      <WebhardSaveLocation path={path} />
    </section>
  );
}
