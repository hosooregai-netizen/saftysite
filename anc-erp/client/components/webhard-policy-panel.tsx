"use client";

import { useState, useTransition } from "react";

import type { WebhardPolicy } from "../../packages/contracts/src";
import { updateAdminWebhardPolicyAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function WebhardPolicyPanel({ policy }: { policy: WebhardPolicy }) {
  const [expiryDays, setExpiryDays] = useState(policy.sharedLinkExpiryDays);
  const [message, setMessage] = useState("웹하드 정책");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WebhardPolicyPanel</p>
          <h3 className="panel-title">웹하드 기본 정책</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="key-value-grid">
        <div className="kv-card">
          <strong>defaultRootFolderName</strong>
          <span>{policy.defaultRootFolderName}</span>
        </div>
        <div className="kv-card">
          <strong>generatedDocumentsFolderName</strong>
          <span>{policy.generatedDocumentsFolderName}</span>
        </div>
        <div className="kv-card">
          <strong>submissionFolderName</strong>
          <span>{policy.submissionFolderName}</span>
        </div>
        <label className="kv-card">
          <strong>sharedLinkExpiryDays</strong>
          <input
            className="note-input"
            type="number"
            value={expiryDays}
            onChange={(event) => setExpiryDays(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="utility-row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await updateAdminWebhardPolicyAction({ sharedLinkExpiryDays: expiryDays });
                setMessage("PATCH /admin/webhard-policies");
              } catch {
                setMessage("정책 저장 대기");
              }
            })
          }
          type="button"
        >
          정책 저장
        </button>
      </div>
    </section>
  );
}
