"use client";

import { useState } from "react";

import type { SafetyCostUsage } from "../../packages/contracts/src";
import { syncSafetyCostUsageDraft } from "../lib/safety-cost-actions";
import { StatusBadge } from "./status-badge";

type SafetyCostSyncToReportButtonProps = {
  usage: SafetyCostUsage;
  documentId?: string | null;
};

export function SafetyCostSyncToReportButton({
  usage,
  documentId,
}: SafetyCostSyncToReportButtonProps) {
  const [targetDocumentId, setTargetDocumentId] = useState(
    documentId ?? usage.syncedDocumentId ?? "",
  );
  const [message, setMessage] = useState("반영 대기");

  async function handleSync() {
    if (!targetDocumentId) {
      setMessage("documentId 필요");
      return;
    }
    setMessage("반영 중");
    try {
      await syncSafetyCostUsageDraft(usage.id, { documentId: targetDocumentId });
      setMessage("POST /safety-cost-usages/{id}/sync-to-report");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostSyncToReportButton</p>
          <h3 className="panel-title">보고서 반영</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="form-field">
        <label htmlFor="safety-cost-sync-document-id">대상 문서</label>
        <input
          className="fake-input"
          id="safety-cost-sync-document-id"
          onChange={(event) => setTargetDocumentId(event.target.value)}
          value={targetDocumentId}
        />
      </div>
      <div className="button-row">
        <StatusBadge
          tone={usage.status === "synced_to_report" ? "submitted" : usage.status === "confirmed" ? "success" : "warning"}
          label={usage.status === "synced_to_report" ? "반영 완료" : usage.status === "confirmed" ? "반영 가능" : "확정 필요"}
        />
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleSync} type="button">
          보고서 반영 API 호출
        </button>
      </div>
    </section>
  );
}
