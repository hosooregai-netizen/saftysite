"use client";

import { useMemo, useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { WorkScheduleAttachment } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function WorkScheduleAttachmentPanel({
  inspectionRoundId,
  items,
}: {
  inspectionRoundId: string;
  items: WorkScheduleAttachment[];
}) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [message, setMessage] = useState("첨부 구조 검토");

  async function handleCreateAttachment() {
    const first = items[0];
    if (!first) {
      setMessage("첨부 원본 확인 필요");
      return;
    }
    setMessage("첨부 등록 중");
    try {
      await api.createWorkScheduleAttachment(inspectionRoundId, {
        fileId: first.fileId,
        fileName: first.fileName,
        storagePath: first.storagePath,
        attachmentType: first.attachmentType,
        sourceLabel: first.sourceLabel ?? null,
      });
      setMessage("첨부 생성 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  async function handleUpdateAttachment(item: WorkScheduleAttachment) {
    setMessage("첨부 수정 중");
    try {
      await api.updateWorkScheduleAttachment(item.id, {
        sourceLabel: item.sourceLabel ?? "검토 필요",
      });
      setMessage("첨부 수정 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WorkScheduleAttachmentPanel</p>
          <h3>공사일정 첨부</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="section-stack">
        {items.map((item) => (
          <div className="inspection-attachment-item" key={item.id}>
            <div>
              <strong>{item.fileName}</strong>
              <span>{item.sourceLabel ?? item.attachmentType}</span>
            </div>
            <div className="link-list">
              <span className="table-subtext">{item.storagePath}</span>
              <button className="inline-link button-reset" onClick={() => handleUpdateAttachment(item)} type="button">
                첨부 수정 API
              </button>
            </div>
          </div>
        ))}
        <div className="link-list">
          <button className="inline-link button-reset" onClick={handleCreateAttachment} type="button">
            첨부 생성 API 호출
          </button>
        </div>
        {items.length === 0 ? <p>연결된 공사일정 첨부가 없습니다.</p> : null}
      </div>
    </section>
  );
}
