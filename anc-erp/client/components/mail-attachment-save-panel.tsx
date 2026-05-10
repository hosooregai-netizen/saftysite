"use client";

import { useState } from "react";

import type { MailAttachment } from "../../packages/contracts/src";
import {
  getMailAttachmentSaveSuggestionsDraft,
  saveMailAttachmentToWebhardDraft as saveLegacyMailAttachmentToWebhardDraft,
} from "../lib/webhard-actions";
import { saveMailboxAttachmentToWebhardDraft } from "../lib/mail-actions";

type MailAttachmentSavePanelProps =
  | {
      attachments: MailAttachment[];
      projectId?: string | null;
    }
  | {
      projectId: string;
      attachments?: undefined;
    };

export function MailAttachmentSavePanel(props: MailAttachmentSavePanelProps) {
  const [result, setResult] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [messageId, setMessageId] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleAttachmentSave(attachmentId: string) {
    const response = await saveMailboxAttachmentToWebhardDraft(attachmentId);
    setResult(response.attachment.savedFileId ?? "saved");
  }

  async function handleLegacySave() {
    if (!("projectId" in props) || props.attachments) {
      return;
    }
    if (!messageId || !fileName) {
      setResult("messageId와 파일명을 입력하세요.");
      return;
    }
    const suggestion = await getMailAttachmentSaveSuggestionsDraft(messageId, props.projectId);
    setSuggestionText(`${suggestion.folder.path} · ${suggestion.linkedEntityType}`);
    const response = await saveLegacyMailAttachmentToWebhardDraft(messageId, {
      projectId: props.projectId,
      fileName,
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });
    setResult(response.file.fileName);
  }

  if ("attachments" in props && props.attachments) {
    return (
      <section className="panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">MailAttachmentSavePanel</p>
            <h3 className="panel-title">첨부파일 웹하드 저장</h3>
          </div>
          <span className={`status ${props.attachments.some((item) => !item.savedFileId) ? "warning" : "submitted"}`}>
            {props.attachments.some((item) => !item.savedFileId) ? "저장 필요" : "저장 완료"}
          </span>
        </div>
        <div className="stack-list">
          {props.attachments.length === 0 ? <p className="empty-state">첨부파일이 없습니다.</p> : null}
          {props.attachments.map((attachment) => (
            <article className="mini-card mailbox-attachment-card" key={attachment.id}>
              <div className="utility-row" style={{ justifyContent: "space-between" }}>
                <strong>{attachment.fileName}</strong>
                <span className="pill outline">{attachment.mimeType}</span>
              </div>
              <p className="muted">미저장 첨부는 웹하드에 연결해 project/document/submission trace를 유지합니다.</p>
              <div className="utility-row">
                <button onClick={() => handleAttachmentSave(attachment.id)} type="button">
                  웹하드 저장
                </button>
                {attachment.savedFileId ? <span className="status submitted">저장됨</span> : <span className="status warning">미저장</span>}
              </div>
            </article>
          ))}
        </div>
        {result ? <p className="inline-link-meta">최근 저장 결과: {result}</p> : null}
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MailAttachmentSavePanel</p>
          <h3 className="panel-title">메일 첨부 저장</h3>
        </div>
      </div>
      <label className="form-field">
        <span>messageId</span>
        <input
          className="fake-input"
          onChange={(event) => setMessageId(event.target.value)}
          placeholder="실제 메일 메시지 ID"
          value={messageId}
        />
      </label>
      <label className="form-field">
        <span>파일명</span>
        <input
          className="fake-input"
          onChange={(event) => setFileName(event.target.value)}
          placeholder="예: draft-attachment.pdf"
          value={fileName}
        />
      </label>
      <button className="secondary-button" onClick={handleLegacySave} type="button">
        웹하드 저장
      </button>
      {suggestionText ? <p className="inline-link-meta">추천 저장 위치: {suggestionText}</p> : null}
      {result ? <p>저장됨: {result}</p> : null}
    </section>
  );
}
