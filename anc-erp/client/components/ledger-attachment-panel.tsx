"use client";

import { useState } from "react";

import type { LedgerAttachment } from "../../packages/contracts/src";
import { linkSafetyHealthLedgerAttachmentDraft } from "../lib/safety-health-ledger-actions";

export function LedgerAttachmentPanel({
  ledgerId,
  items,
}: {
  ledgerId: string;
  items: LedgerAttachment[];
}) {
  const [fileName, setFileName] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleLink() {
    if (!fileName.trim() || !storagePath.trim()) {
      setMessage("파일명과 저장경로를 입력하세요.");
      return;
    }
    await linkSafetyHealthLedgerAttachmentDraft(ledgerId, {
      fileId: `draft-${fileName}`,
      fileName,
      storagePath,
      attachmentType: "evidence",
    });
    setMessage("POST /safety-health-ledgers/{id}/attachments");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerAttachmentPanel</p>
          <h3 className="panel-title">첨부자료</h3>
        </div>
      </div>
      <div className="ops-card-list">
        {items.map((item) => (
          <article className="ops-item" key={item.id}>
            <strong>{item.fileName}</strong>
            <span>{item.storagePath}</span>
          </article>
        ))}
      </div>
      <input className="fake-input" onChange={(event) => setFileName(event.target.value)} placeholder="파일명" value={fileName} />
      <input className="fake-input" onChange={(event) => setStoragePath(event.target.value)} placeholder="웹하드 경로" value={storagePath} />
      <div className="inline-actions">
        <button className="secondary-button" onClick={handleLink} type="button">연결</button>
      </div>
      {message ? <p className="form-helper">{message}</p> : null}
    </section>
  );
}
