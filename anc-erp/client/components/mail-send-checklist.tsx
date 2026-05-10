"use client";

import { useState } from "react";

import { sendMailDraftAction, validateMailDraftAction } from "../lib/mail-actions";

export function MailSendChecklist({ draftId }: { draftId: string }) {
  const [status, setStatus] = useState("");

  async function handleValidate() {
    const response = await validateMailDraftAction(draftId);
    setStatus(response.sendBlocked ? response.warnings.join(", ") || "blocked" : "validated");
  }

  async function handleSend() {
    const response = await sendMailDraftAction(draftId, {});
    setStatus(response.sendMode ?? response.mailThread?.id ?? "sent");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MailSendChecklist</p>
          <h3 className="panel-title">발송 전 체크리스트</h3>
        </div>
        {status ? <span className="status info">{status}</span> : <span className="status review">검토 전</span>}
      </div>
      <div className="mailbox-checklist">
        <div className="kv-card">
          <strong>수신자</strong>
          <span>받는 사람, 참조자, 발주처/시공사 대상 확인</span>
        </div>
        <div className="kv-card">
          <strong>첨부파일</strong>
          <span>최종본, 지적사진, 증빙 파일 누락 여부 확인</span>
        </div>
        <div className="kv-card">
          <strong>연결 엔티티</strong>
          <span>Document / Finding / Submission linkage 확인</span>
        </div>
      </div>
      <div className="utility-row">
        <button type="button" onClick={handleValidate}>
          발송 전 검증
        </button>
        <button type="button" onClick={handleSend}>
          발송
        </button>
      </div>
    </section>
  );
}
