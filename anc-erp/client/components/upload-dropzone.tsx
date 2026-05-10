"use client";

import { useState } from "react";

import { uploadWebhardFileDraft } from "../lib/webhard-actions";

export function UploadDropzone({ projectId, folderId }: { projectId: string; folderId: string }) {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleUpload() {
    if (!fileName.trim()) {
      setStatus("fileName required");
      return;
    }
    setStatus("uploading");
    await uploadWebhardFileDraft({
      projectId,
      folderId,
      fileName: fileName.trim(),
      mimeType: "text/plain",
      sizeBytes: 64,
      source: "upload",
    });
    setStatus("saved");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">UploadDropzone</p>
          <h3 className="panel-title">업로드</h3>
        </div>
        <span className="pill outline">{status}</span>
      </div>
      <label className="form-field">
        <span>파일명</span>
        <input
          className="fake-input"
          onChange={(event) => setFileName(event.target.value)}
          placeholder="예: draft-upload.bin"
          value={fileName}
        />
      </label>
      <button className="primary-button" onClick={handleUpload} type="button">
        드래그 앤 드롭 대체 업로드
      </button>
    </section>
  );
}
