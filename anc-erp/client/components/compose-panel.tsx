"use client";

import { useState } from "react";

import type { MailDraft, MailTemplate } from "../../packages/contracts/src";
import { createMailDraftAction, updateMailDraftAction } from "../lib/mail-actions";
import { DocumentPreview } from "./document-preview";
import { MailAIDraftPanel } from "./mail-ai-draft-panel";
import { MailRecipientInput } from "./mail-recipient-input";
import { MailSendChecklist } from "./mail-send-checklist";
import { MailTemplateSelector } from "./mail-template-selector";

type ComposePanelProps = {
  draft: MailDraft;
  templates: MailTemplate[];
};

export function ComposePanel({ draft, templates }: ComposePanelProps) {
  const [currentDraft, setCurrentDraft] = useState<MailDraft>(draft);

  async function ensureDraft() {
    if (currentDraft.id !== "mail-draft-empty") {
      return currentDraft.id;
    }
    const response = await createMailDraftAction(currentDraft);
    const nextDraft = response.draft ?? currentDraft;
    setCurrentDraft(nextDraft);
    return nextDraft.id;
  }

  async function savePatch(patch: Record<string, unknown>) {
    const draftId = await ensureDraft();
    const response = await updateMailDraftAction(draftId, patch);
    if (response.draft) {
      setCurrentDraft(response.draft);
    }
  }

  return (
    <section className="dense-grid mailbox-compose-grid">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">ComposePanel</p>
            <h2>메일 작성</h2>
            <p className="muted">프로젝트/문서/제출 연결을 유지한 상태로 목적별 메일 초안을 작성합니다.</p>
          </div>
          <div className="mailbox-flag-list">
            <span className={`status ${currentDraft.mode === "connected_oauth_mode" ? "submitted" : "warning"}`}>
              {currentDraft.mode === "connected_oauth_mode" ? "connected send" : "guest draft"}
            </span>
            <span className="status review">{currentDraft.draftType}</span>
          </div>
        </div>
        <div className="mailbox-compose-summary">
          <article className="hero-summary-card">
            <span>project</span>
            <strong>{currentDraft.projectId ?? "미연결"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>document</span>
            <strong>{currentDraft.documentId ?? "-"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>findings</span>
            <strong>{currentDraft.findingIds.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>attachments</span>
            <strong>{currentDraft.attachmentFileIds.length}</strong>
          </article>
        </div>
        <div className="key-value-grid">
          <MailRecipientInput
            label="받는 사람"
            value={currentDraft.toAddresses}
            onChange={(value) => {
              setCurrentDraft({ ...currentDraft, toAddresses: value });
              void savePatch({ toAddresses: value });
            }}
          />
          <MailRecipientInput
            label="참조"
            value={currentDraft.ccAddresses}
            onChange={(value) => {
              setCurrentDraft({ ...currentDraft, ccAddresses: value });
              void savePatch({ ccAddresses: value });
            }}
          />
        </div>
        <MailTemplateSelector
          templates={templates}
          value={currentDraft.templateId}
          onChange={(value) => {
            setCurrentDraft({ ...currentDraft, templateId: value });
            void savePatch({ templateId: value });
          }}
        />
        <label className="field">
          <span className="field-label">제목</span>
          <input
            value={currentDraft.subject}
            onChange={(event) => {
              const value = event.target.value;
              setCurrentDraft({ ...currentDraft, subject: value });
              void savePatch({ subject: value });
            }}
          />
        </label>
        <label className="field">
          <span className="field-label">본문</span>
          <textarea
            rows={12}
            value={currentDraft.body}
            onChange={(event) => {
              const value = event.target.value;
              setCurrentDraft({ ...currentDraft, body: value });
              void savePatch({ body: value });
            }}
          />
        </label>
        {currentDraft.id !== "mail-draft-empty" ? <MailAIDraftPanel draftId={currentDraft.id} /> : null}
        {currentDraft.id !== "mail-draft-empty" ? <MailSendChecklist draftId={currentDraft.id} /> : null}
      </section>
      <DocumentPreview
        title="제출/발송 미리보기"
        statusLabel={currentDraft.mode === "connected_oauth_mode" ? "Connected Send" : "Guest Draft"}
        statusTone={currentDraft.mode === "connected_oauth_mode" ? "submitted" : "review"}
        previewTitle={currentDraft.subject || "메일 제목 미리보기"}
        rows={[
          { label: "발송 목적", status: currentDraft.draftType, note: "목적별 템플릿/연결 상태 확인" },
          { label: "받는 사람", status: `${currentDraft.toAddresses.length}명`, note: "발주처/시공사/내부 수신자 확인" },
          { label: "첨부", status: `${currentDraft.attachmentFileIds.length}건`, note: "최종본/사진/증빙 누락 여부 검토" },
        ]}
        noteBadges={[
          currentDraft.mode === "connected_oauth_mode" ? "발송 가능" : "AI 초안",
          currentDraft.documentId ? "문서 연결" : "연결 검토 필요",
        ]}
      />
    </section>
  );
}
