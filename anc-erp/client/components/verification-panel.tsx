"use client";

import { useState } from "react";

import type { CorrectiveAction } from "../../packages/contracts/src";
import {
  rejectCorrectiveActionDraft,
  verifyCorrectiveActionDraft,
} from "../lib/finding-actions";
import { CorrectiveActionStatusBadge } from "./corrective-action-status-badge";
import { StatusBadge } from "./status-badge";

type VerificationPanelProps = {
  actions: CorrectiveAction[];
};

export function VerificationPanel({ actions }: VerificationPanelProps) {
  const verifiedCount = actions.filter((item) => item.status === "verified").length;
  const [message, setMessage] = useState("검토 대기");

  async function handleVerify(action: CorrectiveAction) {
    setMessage("확인 중");
    try {
      await verifyCorrectiveActionDraft(action.id, {
        verifiedBy: "user-engineer-001",
        verifiedAt: "2026-05-10T09:00:00+09:00",
      });
      setMessage("POST /corrective-actions/{id}/verify");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  async function handleReject(action: CorrectiveAction) {
    setMessage("반려 중");
    try {
      await rejectCorrectiveActionDraft(action.id, {
        rejectedReason: "현장 재확인 필요",
      });
      setMessage("POST /corrective-actions/{id}/reject");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Verification Panel</p>
          <h3>조치 확인 / 반려 포인트</h3>
        </div>
        <div className="status-stack">
          <StatusBadge tone={verifiedCount > 0 ? "success" : "warning"} label={`확인 ${verifiedCount}건`} />
          <StatusBadge tone="review" label={message} />
        </div>
      </div>
      <div className="section-stack">
        {actions.map((action) => (
          <article className="card muted-card" key={action.id}>
            <div className="card-head">
              <strong>{action.actionDetail}</strong>
              <CorrectiveActionStatusBadge status={action.status} />
            </div>
            <p className="table-subtext">확인자: {action.verifiedBy ?? "-"} / 확인일: {action.verifiedAt ?? "-"}</p>
            <p>{action.verificationComment ?? action.rejectedReason ?? "검토 메모 없음"}</p>
            <div className="link-list">
              <button className="inline-link button-reset" onClick={() => handleVerify(action)} type="button">
                확인 API 호출
              </button>
              <button className="inline-link button-reset" onClick={() => handleReject(action)} type="button">
                반려 API 호출
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
