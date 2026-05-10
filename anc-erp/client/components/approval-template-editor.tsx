"use client";

import { useState, useTransition } from "react";

import type { ApprovalTemplateDetailResponse } from "../../packages/contracts/src";
import { updateAdminApprovalTemplateAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

type ApprovalTemplateEditorProps = {
  detail: ApprovalTemplateDetailResponse;
};

export function ApprovalTemplateEditor({ detail }: ApprovalTemplateEditorProps) {
  const [name, setName] = useState(detail.template.name);
  const [message, setMessage] = useState("편집 대기");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ApprovalTemplateEditor</p>
          <h3 className="panel-title">템플릿 편집</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <input className="note-input" value={name} onChange={(event) => setName(event.target.value)} />
      <div className="utility-row">
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await updateAdminApprovalTemplateAction(detail.template.id, { name });
                setMessage("PATCH API 연결됨");
              } catch {
                setMessage("PATCH 대기");
              }
            })
          }
          type="button"
        >
          템플릿 저장
        </button>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await updateAdminApprovalTemplateAction(detail.template.id, { status: "published" });
                setMessage("PATCH publish API 연결됨");
              } catch {
                setMessage("publish 대기");
              }
            })
          }
          type="button"
        >
          템플릿 게시
        </button>
      </div>
    </section>
  );
}
