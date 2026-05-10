"use client";

import { useState } from "react";

import type { MissingField, ReviewWarning } from "../../packages/contracts/src";
import { exportSafetyHealthLedgerDraft, validateSafetyHealthLedgerDraft } from "../lib/safety-health-ledger-actions";
import { WebhardSaveLocation } from "./webhard-save-location";

export function LedgerExportChecklist({
  ledgerId,
  missingFields,
  warnings,
  exportPath,
}: {
  ledgerId: string;
  missingFields: MissingField[];
  warnings: ReviewWarning[];
  exportPath?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleValidate() {
    await validateSafetyHealthLedgerDraft(ledgerId);
    setMessage("POST /safety-health-ledgers/{id}/validate");
  }

  async function handleExport() {
    await exportSafetyHealthLedgerDraft(ledgerId, {});
    setMessage("POST /safety-health-ledgers/{id}/export");
  }

  return (
    <section className="panel ledger-export-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerExportChecklist</p>
          <h3 className="panel-title">export 전 검토</h3>
          <p className="card-copy">필수 누락, 반복 위험, 미조치 지적, 웹하드 저장 문맥을 먼저 확인합니다.</p>
        </div>
      </div>
      <div className="ops-card-list ledger-export-summary">
        <article className="ops-item">
          <strong>필수 누락</strong>
          <span>{missingFields.length}건</span>
        </article>
        <article className="ops-item">
          <strong>검토 경고</strong>
          <span>{warnings.length}건</span>
        </article>
      </div>
      <div className="ops-card-list">
        {missingFields.map((item) => (
          <article className="ops-item ledger-check-item" key={`${item.field}-${item.message}`}>
            <strong>{item.label ?? item.field}</strong>
            <span>{item.message}</span>
          </article>
        ))}
        {warnings.map((item, index) => (
          <article className="ops-item ledger-check-item warning" key={`${item.type}-${index}`}>
            <strong>{item.sectionKey ?? item.type}</strong>
            <span>{item.message}</span>
          </article>
        ))}
      </div>
      <div className="inline-actions">
        <button className="secondary-button" onClick={handleValidate} type="button">validate</button>
        <button className="primary-button" onClick={handleExport} type="button">export</button>
      </div>
      <WebhardSaveLocation path={exportPath} />
      {message ? <p className="form-helper">{message}</p> : null}
    </section>
  );
}
