"use client";

import { useState } from "react";

import {
  syncSafetyHealthLedgerFindingHistoryDraft,
  syncSafetyHealthLedgerInspectionHistoryDraft,
  syncSafetyHealthLedgerSafetyCostHistoryDraft,
} from "../lib/safety-health-ledger-actions";

export function LedgerSyncPreviewModal({
  ledgerId,
  target,
}: {
  ledgerId: string;
  target: "inspection" | "finding" | "safety_cost";
}) {
  const [message, setMessage] = useState<string | null>(null);
  const targetLabel =
    target === "inspection"
      ? "점검이력"
      : target === "finding"
        ? "지적/조치 이력"
        : "산안비 이력";

  async function handleSync() {
    if (target === "inspection") {
      await syncSafetyHealthLedgerInspectionHistoryDraft(ledgerId);
      setMessage("POST /inspection-history/sync");
      return;
    }
    if (target === "finding") {
      await syncSafetyHealthLedgerFindingHistoryDraft(ledgerId);
      setMessage("POST /finding-history/sync");
      return;
    }
    await syncSafetyHealthLedgerSafetyCostHistoryDraft(ledgerId);
    setMessage("POST /safety-cost-history/sync");
  }

  return (
    <section className="panel ledger-sync-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerSyncPreviewModal</p>
          <h3 className="panel-title">{targetLabel} sync preview</h3>
        </div>
      </div>
      <div className="ops-card-list">
        <article className="ops-item">
          <strong>새로 반영될 원본</strong>
          <span>{targetLabel} 기준 최신 변경분을 현재 대장 snapshot에 다시 누적합니다.</span>
        </article>
        <article className="ops-item">
          <strong>검토 포인트</strong>
          <span>중복 항목, 반복 위험, 미조치 상태, latest snapshot 여부를 함께 확인하세요.</span>
        </article>
      </div>
      <div className="inline-actions">
        <button className="secondary-button" onClick={handleSync} type="button">sync</button>
      </div>
      {message ? <p className="form-helper">{message}</p> : null}
    </section>
  );
}
