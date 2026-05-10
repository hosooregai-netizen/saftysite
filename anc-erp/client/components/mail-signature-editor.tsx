"use client";

import { useState } from "react";

import type { MailSignature } from "../../packages/contracts/src";
import { updateMailSignatureDraft } from "../lib/mail-actions";

export function MailSignatureEditor({ signature }: { signature: MailSignature }) {
  const [content, setContent] = useState(signature.content);

  async function handleSave() {
    await updateMailSignatureDraft(signature.id, { content });
  }

  return (
    <section className="panel">
      <p className="card-eyebrow">MailSignatureEditor</p>
      <h3 className="panel-title">{signature.label}</h3>
      <textarea rows={6} value={content} onChange={(event) => setContent(event.target.value)} />
      <button type="button" onClick={handleSave}>
        서명 저장
      </button>
    </section>
  );
}
