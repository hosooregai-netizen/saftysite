"use client";

import { useState } from "react";

type WebhardFilePickerProps = {
  onPick: (payload: {
    fileId: string;
    fileName: string;
    storagePath: string;
    attachmentType: string;
    sourceLabel?: string;
  }) => void;
};

export function WebhardFilePicker({ onPick }: WebhardFilePickerProps) {
  const [fileId, setFileId] = useState("");
  const [fileName, setFileName] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [attachmentType, setAttachmentType] = useState("other");
  const [sourceLabel, setSourceLabel] = useState("");

  function handlePick() {
    if (!fileId.trim() || !fileName.trim() || !storagePath.trim()) {
      return;
    }
    onPick({
      fileId: fileId.trim(),
      fileName: fileName.trim(),
      storagePath: storagePath.trim(),
      attachmentType,
      sourceLabel: sourceLabel.trim() || undefined,
    });
  }

  return (
    <div className="form-grid">
      <label className="form-field">
        <span>fileId</span>
        <input className="fake-input" onChange={(event) => setFileId(event.target.value)} value={fileId} />
      </label>
      <label className="form-field">
        <span>파일명</span>
        <input className="fake-input" onChange={(event) => setFileName(event.target.value)} value={fileName} />
      </label>
      <label className="form-field span-2">
        <span>웹하드 경로</span>
        <input className="fake-input" onChange={(event) => setStoragePath(event.target.value)} value={storagePath} />
      </label>
      <label className="form-field">
        <span>첨부 유형</span>
        <select className="select-field" onChange={(event) => setAttachmentType(event.target.value)} value={attachmentType}>
          <option value="schedule">공정표</option>
          <option value="organization">조직도</option>
          <option value="education">교육자료</option>
          <option value="other">기타</option>
        </select>
      </label>
      <label className="form-field">
        <span>출처 라벨</span>
        <input className="fake-input" onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
      </label>
      <div className="inline-actions">
        <button className="secondary-button" onClick={handlePick} type="button">
          파일 연결
        </button>
      </div>
    </div>
  );
}
