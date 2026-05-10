"use client";

import { useState } from "react";

import type { AdditionalHazardItem } from "../../packages/contracts/src";
import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function AdditionalHazardChecklistTable({
  sessionId,
  items,
}: {
  sessionId: string;
  items: AdditionalHazardItem[];
}) {
  const [message, setMessage] = useState("추가 위험요인 관리");

  async function handleCreate() {
    setMessage("등록 중");
    try {
      const api = createBrowserApiClient();
      await api.createChecklistAdditionalHazard(sessionId, {
        hazardDescription: "추가 유해·위험요인 초안",
        checkPoint: "현장 확인 필요",
        implementationStatus: "not_checked",
      });
      setMessage("POST /additional-hazards");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  async function handleMarkReview(hazardId: string) {
    setMessage("상태 저장 중");
    try {
      const api = createBrowserApiClient();
      await api.updateChecklistAdditionalHazard(hazardId, {
        implementationStatus: "identified",
      });
      setMessage("PATCH /additional-hazards");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AdditionalHazardChecklistTable</p>
          <h3>추가 유해·위험요인</h3>
          <p>표준 항목 외 위험요인을 InspectionRound 원본 데이터로 추가 등록합니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>No</th>
            <th>유해·위험요인</th>
            <th>이행상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.no}</td>
              <td>{item.hazardDescription}</td>
              <td>{item.implementationStatus}</td>
              <td>
                <button className="inline-link button-reset" onClick={() => handleMarkReview(item.id)} type="button">
                  검토상태 저장
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleCreate} type="button">
          추가 위험요인 등록 API
        </button>
      </div>
    </section>
  );
}
