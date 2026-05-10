"use client";

import { useState } from "react";

import { createWebhardFolderDraft } from "../lib/webhard-actions";

export function NewFolderModal({ projectId, parentFolderId }: { projectId: string; parentFolderId?: string }) {
  const [name, setName] = useState("새 폴더");

  async function handleCreate() {
    await createWebhardFolderDraft({ projectId, parentFolderId, name, type: "custom" });
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">NewFolderModal</p>
          <h3 className="panel-title">새 폴더</h3>
        </div>
      </div>
      <label className="form-field">
        <span>폴더명</span>
        <input className="fake-input" onChange={(event) => setName(event.target.value)} value={name} />
      </label>
      <button className="secondary-button" onClick={handleCreate} type="button">
        폴더 생성
      </button>
    </section>
  );
}

