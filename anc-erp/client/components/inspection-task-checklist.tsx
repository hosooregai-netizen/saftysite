"use client";

import { useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { InspectionTask } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function InspectionTaskChecklist({ items }: { items: InspectionTask[] }) {
  const [message, setMessage] = useState("업무 상태 검토");

  async function handleMarkDone(task: InspectionTask) {
    const api = createBrowserApiClient();
    setMessage("업무 상태 반영 중");
    try {
      await api.updateInspectionTask(task.id, { status: "done" });
      setMessage("업무 PATCH API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionTaskChecklist</p>
          <h3>회차 업무 체크리스트</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="section-stack">
        {items.map((item) => (
          <div className="inspection-action-item" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.dueDate ?? "마감 미정"}</span>
            </div>
            <div className="link-list">
              <StatusBadge tone={item.status === "done" ? "success" : item.status === "blocked" ? "danger" : "info"} label={item.status} />
              {item.status !== "done" ? (
                <button className="inline-link button-reset" onClick={() => handleMarkDone(item)} type="button">
                  완료 처리 API
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
