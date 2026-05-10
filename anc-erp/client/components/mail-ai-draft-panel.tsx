"use client";

import { useState } from "react";

import { generateMailDraftAction } from "../lib/mail-actions";

export function MailAIDraftPanel({ draftId }: { draftId: string }) {
  const [status, setStatus] = useState("");

  async function handleGenerate() {
    const response = await generateMailDraftAction(draftId, { prompt: "프로젝트/문서 연결을 유지한 draft only 문구 생성" });
    setStatus(response.warnings.join(", ") || "generated");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MailAIDraftPanel</p>
          <h3 className="panel-title">AI 초안 생성</h3>
        </div>
      </div>
      <p className="muted">AI 출력은 draft로만 사용되고, 최종 발송 전 사람 검토가 필요합니다.</p>
      <div className="utility-row">
        <button type="button" onClick={handleGenerate}>
          초안 생성
        </button>
        {status ? <span className="pill outline">{status}</span> : null}
      </div>
    </section>
  );
}
