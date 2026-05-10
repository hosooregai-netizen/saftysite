"use client";

import { useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { InspectionRescheduleLog } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function InspectionRescheduleModal({
  inspectionRoundId,
  logs,
}: {
  inspectionRoundId: string;
  logs: InspectionRescheduleLog[];
}) {
  const [plannedDate, setPlannedDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("변경 이력 검토");

  async function handleReschedule() {
    if (!plannedDate || !reason.trim()) {
      return;
    }
    const api = createBrowserApiClient();
    setMessage("변경 요청 중");
    try {
      await api.rescheduleInspectionRound(inspectionRoundId, {
        plannedDate,
        reason,
      });
      setMessage("일정 변경 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionRescheduleModal</p>
          <h3>일정 변경 이력</h3>
          <p>변경 사유를 필수로 받고, round update와 별도로 reschedule log를 남깁니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`inspection-reschedule-date-${inspectionRoundId}`}>변경 예정일</label>
          <input
            className="fake-input"
            id={`inspection-reschedule-date-${inspectionRoundId}`}
            onChange={(event) => setPlannedDate(event.target.value)}
            type="date"
            value={plannedDate}
          />
        </div>
        <div className="form-field">
          <label htmlFor={`inspection-reschedule-reason-${inspectionRoundId}`}>변경 사유</label>
          <input
            className="fake-input"
            id={`inspection-reschedule-reason-${inspectionRoundId}`}
            onChange={(event) => setReason(event.target.value)}
            type="text"
            value={reason}
          />
        </div>
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleReschedule} type="button">
          일정 변경 API 호출
        </button>
      </div>
      {logs.length === 0 ? (
        <p>등록된 일정 변경 이력이 없습니다.</p>
      ) : (
        <div className="section-stack" style={{ marginTop: 16 }}>
          {logs.map((log) => (
            <div className="missing-item" key={log.id}>
              <strong>{log.reason}</strong>
              <span>{log.previousPlannedDate ?? "-"} → {log.nextPlannedDate ?? "-"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
