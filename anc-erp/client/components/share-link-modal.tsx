"use client";

import { useState } from "react";

import { createWebhardShareLinkDraft } from "../lib/webhard-actions";

export function ShareLinkModal({
  projectId,
  fileId,
  folderId,
}: {
  projectId: string;
  fileId?: string;
  folderId?: string;
}) {
  const [targetType, setTargetType] = useState(fileId ? "file" : folderId ? "folder" : "file");
  const [targetId, setTargetId] = useState(fileId ?? folderId ?? "");
  const [title, setTitle] = useState("공유 링크");
  const [permission, setPermission] = useState("view_and_download");
  const [result, setResult] = useState("");

  async function handleCreate() {
    const response = await createWebhardShareLinkDraft({
      projectId,
      fileId: targetType === "file" ? targetId : undefined,
      folderId: targetType === "folder" ? targetId : undefined,
      title,
      permission,
    });
    setResult(response.publicUrl);
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ShareLinkModal</p>
          <h3 className="panel-title">공유 링크 생성</h3>
        </div>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>대상 종류</span>
          <select className="select-field" onChange={(event) => setTargetType(event.target.value)} value={targetType}>
            <option value="file">file</option>
            <option value="folder">folder</option>
          </select>
        </label>
        <label className="form-field">
          <span>대상 ID</span>
          <input className="fake-input" onChange={(event) => setTargetId(event.target.value)} value={targetId} />
        </label>
        <label className="form-field">
          <span>제목</span>
          <input className="fake-input" onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label className="form-field">
          <span>권한</span>
          <select className="select-field" onChange={(event) => setPermission(event.target.value)} value={permission}>
            <option value="view">보기</option>
            <option value="download">다운로드</option>
            <option value="view_and_download">보기+다운로드</option>
          </select>
        </label>
      </div>
      <button className="secondary-button" onClick={handleCreate} type="button">
        링크 생성
      </button>
      {result ? <p>{result}</p> : null}
    </section>
  );
}
