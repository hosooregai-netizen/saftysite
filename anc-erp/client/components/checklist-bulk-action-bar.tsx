"use client";

import { useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function ChecklistBulkActionBar({ sessionId }: { sessionId: string }) {
  const [message, setMessage] = useState("벌크 처리 준비");

  async function handleFillNotApplicable() {
    setMessage("벌크 처리 중");
    try {
      const api = createBrowserApiClient();
      await api.fillChecklistResultsNotApplicable(sessionId, { reason: "현장 조건상 제외" });
      setMessage("POST /results/fill-not-applicable");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistBulkActionBar</p>
          <h3>벌크 처리</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleFillNotApplicable} type="button">
          미입력 항목 일괄 해당없음 처리
        </button>
      </div>
    </section>
  );
}
