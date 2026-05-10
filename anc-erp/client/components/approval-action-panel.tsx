"use client";

import { useState, useTransition } from "react";

import {
  approveDocumentStepAction,
  rejectDocumentStepAction,
  requestDocumentApprovalAction,
  requestDocumentStepChangesAction,
} from "../lib/approval-actions";
import { StatusBadge } from "./status-badge";

type ApprovalActionPanelProps = {
  documentId: string;
  workflowId?: string | null;
  currentStepId?: string | null;
};

export function ApprovalActionPanel({ documentId, workflowId, currentStepId }: ApprovalActionPanelProps) {
  const [message, setMessage] = useState("결재 액션 대기");
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
          <p className="card-eyebrow">Mapped Actions</p>
          <h3 className="panel-title">결재 액션 경로</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="stack-list">
        <article className="ops-item">
          <strong>결재 요청</strong>
          <span>{`POST /api/v1/documents/${documentId}/approval/request`}</span>
        </article>
        <article className="ops-item">
          <strong>Workflow 조회</strong>
          <span>{workflowId ? `GET /api/v1/approval-workflows/${workflowId}` : "생성 후 workflowId 연결"}</span>
        </article>
        <article className="ops-item">
          <strong>승인/반려/보완요청</strong>
          <span>approval-steps/{`{stepId}`}/approve | reject | request-changes</span>
        </article>
      </div>
      <div className="utility-row">
        <button
          className="inline-link button-reset"
          disabled={isPending}
          onClick={() => run(() => requestDocumentApprovalAction(documentId, {}), "결재 요청 API 연결됨")}
          type="button"
        >
          결재 요청
        </button>
        <button
          className="inline-link button-reset"
          disabled={!currentStepId || isPending}
          onClick={() => currentStepId && run(() => approveDocumentStepAction(currentStepId, {}), "승인 API 연결됨")}
          type="button"
        >
          승인
        </button>
        <button
          className="inline-link button-reset"
          disabled={!currentStepId || isPending}
          onClick={() => currentStepId && run(() => rejectDocumentStepAction(currentStepId, { comment: "반려" }), "반려 API 연결됨")}
          type="button"
        >
          반려
        </button>
        <button
          className="inline-link button-reset"
          disabled={!currentStepId || isPending}
          onClick={() =>
            currentStepId &&
            run(() => requestDocumentStepChangesAction(currentStepId, { comment: "보완 필요" }), "보완요청 API 연결됨")
          }
          type="button"
        >
          보완 요청
        </button>
      </div>
    </section>
  );
}
