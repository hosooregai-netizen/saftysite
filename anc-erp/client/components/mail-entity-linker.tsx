"use client";

import { useState } from "react";

import { linkMailMessageEntityDraft } from "../lib/mail-actions";

export function MailEntityLinker({ messageId, projectId }: { messageId: string; projectId: string }) {
  const [entityType, setEntityType] = useState("project");
  const [entityId, setEntityId] = useState(projectId);
  const [result, setResult] = useState("");

  async function handleLink() {
    const response = await linkMailMessageEntityDraft(messageId, { projectId, entityType, entityId, relationType: "reference" });
    setResult(response.link ? "linked" : "failed");
  }

  return (
    <section className="panel">
      <p className="card-eyebrow">MailEntityLinker</p>
      <div className="key-value-grid">
        <label className="field">
          <span className="field-label">entityType</span>
          <input value={entityType} onChange={(event) => setEntityType(event.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">entityId</span>
          <input value={entityId} onChange={(event) => setEntityId(event.target.value)} />
        </label>
      </div>
      <div className="utility-row">
        <button type="button" onClick={handleLink}>
          링크 저장
        </button>
        {result ? <span className="pill outline">{result}</span> : null}
      </div>
    </section>
  );
}
