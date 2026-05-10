"use client";

import { useState, useTransition } from "react";

import {
  archiveSubmissionAction,
  confirmSubmissionOwnerReceiptAction,
  markManualSubmissionAction,
  requestSubmissionRevisionAction,
  sendSubmissionMailAction,
} from "../lib/approval-actions";
import { StatusBadge } from "./status-badge";

type SubmissionMailDraftPanelProps = {
  submissionId?: string | null;
};

export function SubmissionMailDraftPanel({ submissionId }: SubmissionMailDraftPanelProps) {
  const [message, setMessage] = useState("제출 액션 대기");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, nextMessage: string) {
    startTransition(async () => {
      try {
        await action();
        setMessage(nextMessage);
      } catch {
        setMessage("API 응답 대기");
      }
    });
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmissionMailDraftPanel</p>
          <h3 className="panel-title">제출 메일 및 확인 액션</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="utility-row">
        <button
          className="inline-link button-reset"
          disabled={!submissionId || isPending}
          onClick={() => submissionId && run(() => sendSubmissionMailAction(submissionId, {}), "send-mail API 연결됨")}
          type="button"
        >
          메일 제출
        </button>
        <button
          className="inline-link button-reset"
          disabled={!submissionId || isPending}
          onClick={() =>
            submissionId &&
            run(() => markManualSubmissionAction(submissionId, { memo: "수동 제출 기록" }), "manual-submit API 연결됨")
          }
          type="button"
        >
          수동 제출 기록
        </button>
        <button
          className="inline-link button-reset"
          disabled={!submissionId || isPending}
          onClick={() => submissionId && run(() => confirmSubmissionOwnerReceiptAction(submissionId), "receipt API 연결됨")}
          type="button"
        >
          수령 확인
        </button>
        <button
          className="inline-link button-reset"
          disabled={!submissionId || isPending}
          onClick={() =>
            submissionId && run(() => requestSubmissionRevisionAction(submissionId, { memo: "보완 요청" }), "revision API 연결됨")
          }
          type="button"
        >
          보완 요청
        </button>
        <button
          className="inline-link button-reset"
          disabled={!submissionId || isPending}
          onClick={() => submissionId && run(() => archiveSubmissionAction(submissionId), "archive API 연결됨")}
          type="button"
        >
          보관
        </button>
      </div>
    </section>
  );
}
