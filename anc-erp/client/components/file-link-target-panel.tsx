"use client";

import { useState } from "react";

import type { FileEntityLink } from "../../packages/contracts/src";
import { createWebhardFileLinkDraft } from "../lib/webhard-actions";

export function FileLinkTargetPanel({ fileId, links }: { fileId: string; links: FileEntityLink[] }) {
  const [entityType, setEntityType] = useState<string>(links[0]?.entityType ?? "");
  const [entityId, setEntityId] = useState<string>(links[0]?.entityId ?? "");

  async function handleLink() {
    if (!entityType || !entityId) {
      return;
    }
    await createWebhardFileLinkDraft(fileId, { entityType, entityId, relationType: "attachment" });
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FileLinkTargetPanel</p>
          <h3 className="panel-title">연결 대상</h3>
        </div>
      </div>
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            {link.entityType} / {link.entityId}
          </li>
        ))}
      </ul>
      <div className="form-grid">
        <label className="form-field">
          <span>entityType</span>
          <input
            className="fake-input"
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="예: document_instance"
            value={entityType}
          />
        </label>
        <label className="form-field">
          <span>entityId</span>
          <input
            className="fake-input"
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="실제 연결 대상 ID"
            value={entityId}
          />
        </label>
      </div>
      <button className="secondary-button" onClick={handleLink} type="button">
        연결 추가
      </button>
    </section>
  );
}
