"use client";

import { useState, useTransition } from "react";

import { requestDocumentStepChangesAction } from "../lib/approval-actions";
import { StatusBadge } from "./status-badge";

type ChangeRequestPanelProps = {
  currentStepId?: string | null;
};

export function ChangeRequestPanel({ currentStepId }: ChangeRequestPanelProps) {
  const [comment, setComment] = useState("보완 요청 사유를 입력하세요.");
  const [message, setMessage] = useState("보완 요청 대기");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChangeRequestPanel</p>
          <h3 className="panel-title">보완 요청</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <textarea className="note-input" value={comment} onChange={(event) => setComment(event.target.value)} />
      <div className="utility-row">
        <button
          className="inline-link button-reset"
          disabled={!currentStepId || isPending}
          onClick={() =>
            startTransition(async () => {
              if (!currentStepId) {
                return;
              }
              try {
                await requestDocumentStepChangesAction(currentStepId, { comment });
                setMessage("보완 요청 API 연결됨");
              } catch {
                setMessage("API 응답 대기");
              }
            })
          }
          type="button"
        >
          보완 요청 보내기
        </button>
      </div>
    </section>
  );
}
