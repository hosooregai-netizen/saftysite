"use client";

import { useState } from "react";

import { updateWebhardFileDraft } from "../lib/webhard-actions";

export function FileTagEditor({ fileId, tags }: { fileId: string; tags: string[] }) {
  const [value, setValue] = useState(tags.join(", "));
  const [status, setStatus] = useState("draft");

  async function handleSave() {
    const nextTags = value.split(",").map((item) => item.trim()).filter(Boolean);
    await updateWebhardFileDraft(fileId, { tags: nextTags });
    setStatus("saved");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FileTagEditor</p>
          <h3 className="panel-title">태그 편집</h3>
        </div>
        <span className="pill outline">{status}</span>
      </div>
      <label className="form-field">
        <span>쉼표로 구분</span>
        <input className="fake-input" onChange={(event) => setValue(event.target.value)} value={value} />
      </label>
      <button className="secondary-button" onClick={handleSave} type="button">
        태그 저장
      </button>
    </section>
  );
}

