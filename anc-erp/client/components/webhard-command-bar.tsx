"use client";

import { useState } from "react";

import { createWebhardFolderDraft, uploadWebhardFileDraft } from "../lib/webhard-actions";

export function WebhardCommandBar({ projectId, folderId }: { projectId?: string; folderId?: string }) {
  const [folderName, setFolderName] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [status, setStatus] = useState("");

  async function handleCreateFolder() {
    if (!projectId || !folderName.trim()) {
      setStatus("projectId와 폴더명을 확인하세요.");
      return;
    }
    await createWebhardFolderDraft({
      projectId,
      parentFolderId: folderId,
      name: folderName.trim(),
      type: "custom",
    });
    setStatus(`폴더 생성: ${folderName.trim()}`);
    setFolderName("");
  }

  async function handleUpload() {
    if (!projectId || !folderId || !uploadFileName.trim()) {
      setStatus("업로드 대상 폴더와 파일명을 확인하세요.");
      return;
    }
    await uploadWebhardFileDraft({
      projectId,
      folderId,
      fileName: uploadFileName.trim(),
      mimeType: "application/octet-stream",
      sizeBytes: 1,
      source: "upload",
    });
    setStatus(`업로드 등록: ${uploadFileName.trim()}`);
    setUploadFileName("");
  }

  return (
    <section className="panel webhard-command-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WebhardCommandBar</p>
          <h3 className="panel-title">작업 명령 바</h3>
          <p className="inline-link-meta">업로드, 분류, 이동, 공유를 한 번에 이어가는 파일 관리자 작업 영역입니다.</p>
        </div>
        <span className="pill outline">Project-linked</span>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>새 폴더명</span>
          <input
            className="fake-input"
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="예: 발주처 전달본"
            value={folderName}
          />
        </label>
        <label className="form-field">
          <span>업로드 파일명</span>
          <input
            className="fake-input"
            onChange={(event) => setUploadFileName(event.target.value)}
            placeholder="예: draft-upload.bin"
            value={uploadFileName}
          />
        </label>
      </div>
      <div className="badge-row" style={{ justifyContent: "space-between" }}>
        <div className="badge-row">
          <button className="primary-button" onClick={handleUpload} type="button">
            업로드 등록
          </button>
          <button className="secondary-button" onClick={handleCreateFolder} type="button">
            새 폴더 생성
          </button>
          <span className="pill">공유 링크</span>
          <span className="pill">이동 / 복사</span>
          <span className="pill">검색</span>
        </div>
        <div className="badge-row">
          <span className="status submitted">공유본 추적</span>
          <span className="status review">최종본 잠금</span>
        </div>
      </div>
      {status ? <p className="inline-link-meta">{status}</p> : null}
    </section>
  );
}
