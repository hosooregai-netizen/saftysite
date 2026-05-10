"use client";

import type { MailAttachment } from "../../packages/contracts/src";
import { saveMailboxAttachmentToWebhardDraft } from "../lib/mail-actions";

export function MailAttachmentList({ attachments }: { attachments: MailAttachment[] }) {
  async function handleSave(attachmentId: string) {
    await saveMailboxAttachmentToWebhardDraft(attachmentId);
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Attachments</p>
          <h3 className="panel-title">첨부파일</h3>
        </div>
        <span className={`status ${attachments.some((item) => !item.savedFileId) ? "warning" : "submitted"}`}>
          {attachments.some((item) => !item.savedFileId) ? "저장 필요" : "저장 완료"}
        </span>
      </div>
      <div className="stack-list">
        {attachments.length === 0 ? <p className="empty-state">첨부파일이 없습니다.</p> : null}
        {attachments.map((attachment) => (
          <article className="mini-card mailbox-attachment-card" key={attachment.id}>
            <div className="utility-row" style={{ justifyContent: "space-between" }}>
              <strong>{attachment.fileName}</strong>
              <span className="pill outline">{attachment.mimeType}</span>
            </div>
            <p className="muted">웹하드 저장 후 FileAsset과 연결되어 제출/증빙 추적에 사용됩니다.</p>
            <div className="utility-row">
              {!attachment.savedFileId ? (
                <button type="button" onClick={() => handleSave(attachment.id)}>
                  웹하드 저장
                </button>
              ) : null}
              {attachment.savedFileId ? <span className="status submitted">저장됨</span> : <span className="status warning">미저장</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
