"use client";

import { useState } from "react";

import { markSafetyReportSubmittedDraft } from "../lib/safety-report-actions";
import { StatusBadge } from "./status-badge";

type MailDraftButtonProps = {
  documentId: string;
};

export function MailDraftButton({ documentId }: MailDraftButtonProps) {
  const [status, setStatus] = useState<string>("");

  async function handleSubmit() {
    const response = await markSafetyReportSubmittedDraft(documentId, {});
    setStatus(response.document.status);
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">MailDraftButton</p>
          <h3>제출 처리</h3>
        </div>
        {status ? <StatusBadge tone="submitted" label={status} /> : null}
      </div>
      <button className="primary-button" onClick={handleSubmit} type="button">
        제출 상태 기록
      </button>
    </section>
  );
}
