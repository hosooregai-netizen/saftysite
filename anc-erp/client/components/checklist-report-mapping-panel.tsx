"use client";

import { useState } from "react";

import type { ChecklistReportMapping } from "../../packages/contracts/src";
import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function ChecklistReportMappingPanel({
  sessionId,
  mappings,
}: {
  sessionId: string;
  mappings: ChecklistReportMapping[];
}) {
  const [message, setMessage] = useState("보고서 매핑 검토");

  async function handleSummarize() {
    setMessage("요약 중");
    try {
      const api = createBrowserApiClient();
      await api.summarizeChecklistSession(sessionId);
      setMessage("POST /summarize");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistReportMappingPanel</p>
          <h3>보고서 매핑</h3>
          <p>체크리스트 입력값이 어떤 보고서 section으로 반영되는지 바로 확인합니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="task-list">
        {mappings.map((mapping) => (
          <div className="task-item" key={mapping.id}>
            <strong>{mapping.reportLabel}</strong>
            <span>{mapping.rowSummary}</span>
            <StatusBadge tone={mapping.stale ? "warning" : "success"} label={mapping.stale ? "stale" : "synced"} />
          </div>
        ))}
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleSummarize} type="button">
          보고서 매핑 요약 API
        </button>
      </div>
    </section>
  );
}
