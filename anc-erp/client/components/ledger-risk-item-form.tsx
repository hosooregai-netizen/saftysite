"use client";

import { useState } from "react";

import { createSafetyHealthLedgerRiskDraft } from "../lib/safety-health-ledger-actions";

export function LedgerRiskItemForm({ ledgerId }: { ledgerId: string }) {
  const [hazardDescription, setHazardDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate() {
    if (!hazardDescription.trim()) {
      setMessage("유해·위험요인을 입력하세요.");
      return;
    }
    await createSafetyHealthLedgerRiskDraft(ledgerId, { hazardDescription, status: "identified" });
    setMessage("POST /safety-health-ledgers/{id}/risks");
    setHazardDescription("");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerRiskItemForm</p>
          <h3 className="panel-title">위험요인 추가</h3>
        </div>
      </div>
      <textarea
        className="fake-input"
        onChange={(event) => setHazardDescription(event.target.value)}
        placeholder="유해·위험요인 초안"
        rows={3}
        value={hazardDescription}
      />
      <div className="inline-actions">
        <button className="primary-button" onClick={handleCreate} type="button">등록</button>
      </div>
      {message ? <p className="form-helper">{message}</p> : null}
    </section>
  );
}
