"use client";

import { useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function MobileChecklistBottomBar({
  sessionId,
  draftId,
}: {
  sessionId: string;
  draftId: string;
}) {
  const [message, setMessage] = useState("모바일 임시저장");

  async function handleCommit() {
    setMessage("commit 중");
    try {
      const api = createBrowserApiClient();
      await api.commitChecklistMobileDraft(sessionId, draftId, {
        clientVersion: 1,
        draftVersion: 1,
        payload: { committed: true },
      });
      setMessage("POST /mobile-drafts/{draftId}/commit");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card checklist-mobile-bottom-bar">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MobileChecklistBottomBar</p>
          <h3>모바일 입력 하단 바</h3>
          <p>이전 / 임시저장 / 다음 / 완료 흐름 중 commit 액션을 우선 노출합니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="link-list checklist-mobile-actions">
        <span className="pill outline">이전</span>
        <span className="pill outline">임시저장</span>
        <span className="pill outline">다음</span>
        <button className="inline-link button-reset" onClick={handleCommit} type="button">
          완료 / commit API
        </button>
      </div>
    </section>
  );
}
