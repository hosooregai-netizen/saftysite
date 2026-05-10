"use client";

import { useState } from "react";

import type { ChecklistPhoto } from "../../packages/contracts/src";
import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function ChecklistPhotoUploader({
  resultId,
  photos,
}: {
  resultId: string;
  photos: ChecklistPhoto[];
}) {
  const [message, setMessage] = useState("사진 연결");

  async function handleUpload() {
    setMessage("업로드 중");
    try {
      const api = createBrowserApiClient();
      await api.uploadChecklistPhoto(resultId, {
        fileId: `draft-file-${resultId}`,
        fileName: `${resultId}-draft-photo.jpg`,
        storagePath: `/draft/checklist/${resultId}-draft-photo.jpg`,
        caption: "현장 사진 초안",
      });
      setMessage("POST /photos/upload");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistPhotoUploader</p>
          <h3>사진</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="task-list">
        {photos.map((photo) => (
          <div className="task-item" key={photo.id}>
            <strong>{photo.fileName}</strong>
            <span>{photo.caption ?? photo.storagePath}</span>
          </div>
        ))}
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleUpload} type="button">
          사진 업로드 API 호출
        </button>
      </div>
    </section>
  );
}
