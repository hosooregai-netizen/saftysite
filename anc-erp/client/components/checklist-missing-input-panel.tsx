"use client";

import { useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function ChecklistMissingInputPanel({ sessionId, warnings }: { sessionId: string; warnings: string[] }) {
  const [message, setMessage] = useState("검토 전 확인");

  async function handleValidate() {
    setMessage("검증 중");
    try {
      const api = createBrowserApiClient();
      await api.validateChecklistResults(sessionId);
      setMessage("POST /results/validate");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistMissingInputPanel</p>
          <h3>미입력 / 경고</h3>
          <p>세션 완료 전 필수 미점검, 사진 누락, 후보 미처리 상태를 먼저 정리합니다.</p>
        </div>
        <StatusBadge tone="warning" label={message} />
      </div>
      <div className="task-list">
        {warnings.map((warning, index) => (
          <div className="task-item" key={`${warning}-${index}`}>
            <strong>{warning}</strong>
          </div>
        ))}
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleValidate} type="button">
          검증 API 호출
        </button>
      </div>
    </section>
  );
}
