"use client";

import { useMemo, useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { InspectionOwnerReportTask } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function OwnerReportStatusMatrix({ items }: { items: InspectionOwnerReportTask[] }) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [message, setMessage] = useState("발주처별 상태 검토");

  async function handleAdvance(task: InspectionOwnerReportTask) {
    setMessage("상태 반영 중");
    try {
      if (task.documentInstanceId) {
        await api.linkOwnerReportDocument(task.id, { documentInstanceId: task.documentInstanceId });
      }
      if (task.exportedFileId) {
        await api.markOwnerReportExported(task.id, { exportedFileId: task.exportedFileId });
      }
      await api.updateOwnerReportTask(task.id, {
        status: task.documentInstanceId ? "review" : "drafting",
      });
      setMessage("발주처 보고서 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  async function handleSubmit(task: InspectionOwnerReportTask) {
    if (!task.submittedAt && !task.mailThreadId && !task.submissionId) {
      return;
    }
    setMessage("제출 상태 반영 중");
    try {
      await api.markOwnerReportSubmitted(task.id, {
        submittedAt: task.submittedAt ?? null,
        mailThreadId: task.mailThreadId ?? null,
        submissionId: task.submissionId ?? null,
      });
      setMessage("제출 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">OwnerReportStatusMatrix</p>
          <h3>발주처별 상태 매트릭스</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>발주처</th>
            <th>문서연결</th>
            <th>최종본</th>
            <th>제출</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.ownerDisplayName ?? item.ownerPartyId}</td>
              <td>{item.documentInstanceId ?? "미연결"}</td>
              <td>{item.exportedFileId ?? "미생성"}</td>
              <td><StatusBadge tone={item.status === "submitted" ? "success" : "review"} label={item.status} /></td>
              <td>
                <div className="link-list">
                  <span>{item.submittedAt ?? item.mailThreadId ?? item.submissionId ?? "확인 필요"}</span>
                  <button className="inline-link button-reset" onClick={() => handleAdvance(item)} type="button">
                    상태 업데이트 API
                  </button>
                  {(item.submittedAt || item.mailThreadId || item.submissionId) ? (
                    <button className="inline-link button-reset" onClick={() => handleSubmit(item)} type="button">
                      제출 표시 API
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
