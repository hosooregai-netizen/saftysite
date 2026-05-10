"use client";

import { useState } from "react";

import type { CorrectiveAction } from "../../packages/contracts/src";
import {
  createCorrectiveActionDraft,
  updateCorrectiveActionDraft,
} from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type CorrectiveActionFormProps = {
  findingId: string;
  findingTitle: string;
  action?: CorrectiveAction;
};

export function CorrectiveActionForm({ findingId, findingTitle, action }: CorrectiveActionFormProps) {
  const [message, setMessage] = useState("draft 검토");

  async function handleSubmitDraft() {
    setMessage("저장 중");
    try {
      if (action) {
        await updateCorrectiveActionDraft(action.id, {
          actionDetail: action.actionDetail,
          actionDate: action.actionDate,
          verificationComment: action.verificationComment,
        });
        setMessage("PATCH /corrective-actions/{id}");
        return;
      }
      await createCorrectiveActionDraft(findingId, {
        actionDetail: "현장 보완조치 초안",
      });
      setMessage("POST /findings/{id}/actions");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Corrective Action Form</p>
          <h3>조치 등록 / 수정</h3>
          <p>{findingTitle}</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="detail-grid">
        <div>
          <strong>조치내용</strong>
          <p>{action?.actionDetail ?? "조치 상세를 입력합니다."}</p>
        </div>
        <div>
          <strong>조치일</strong>
          <p>{action?.actionDate ?? "미정"}</p>
        </div>
        <div>
          <strong>제출자</strong>
          <p>{action?.submittedBy ?? "시공사 담당자 선택"}</p>
        </div>
        <div>
          <strong>확인 메모</strong>
          <p>{action?.verificationComment ?? "검토 후 확인 메모를 남깁니다."}</p>
        </div>
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleSubmitDraft} type="button">
          조치현황 API 호출
        </button>
      </div>
    </section>
  );
}
