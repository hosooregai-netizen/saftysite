"use client";

import type { SafetyManagementPlanAttachment } from "../../packages/contracts/src";
import { linkSafetyManagementAttachmentDraft } from "../lib/safety-management-plan-actions";
import { WebhardFilePicker } from "./webhard-file-picker";

export function AttachmentLinkPanel({ planId, items }: { planId: string; items: SafetyManagementPlanAttachment[] }) {
  async function handleLink(payload: {
    fileId: string;
    fileName: string;
    storagePath: string;
    attachmentType: string;
    sourceLabel?: string;
  }) {
    await linkSafetyManagementAttachmentDraft(planId, payload);
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AttachmentLinkPanel</p>
          <h3 className="panel-title">첨부자료</h3>
        </div>
      </div>
      <WebhardFilePicker onPick={handleLink} />
      <div className="ops-card-list">
        {items.map((item) => (
          <article className="ops-item attachment-item" key={item.id}>
            <strong>{item.fileName}</strong>
            <span>{item.attachmentType}</span>
            <span className="table-subcopy">{item.sourceLabel ?? item.storagePath}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
