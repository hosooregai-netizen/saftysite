"use client";

import { useState } from "react";

import type { ChecklistTemplate } from "../../packages/contracts/src";
import { publishAdminChecklistTemplateAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

export function ChecklistTemplateEditor({ template }: { template: ChecklistTemplate }) {
  const [message, setMessage] = useState("관리자 검토");

  async function handlePublish() {
    setMessage("발행 중");
    try {
      await publishAdminChecklistTemplateAction(template.id);
      setMessage("POST /publish");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistTemplateEditor</p>
          <h3>{template.name}</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <p>{template.description ?? "설명 없음"}</p>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handlePublish} type="button">
          템플릿 발행 API
        </button>
      </div>
    </section>
  );
}
