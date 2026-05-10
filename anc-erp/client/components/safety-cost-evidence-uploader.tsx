"use client";

import { useState } from "react";

import type { SafetyCostEvidence } from "../../packages/contracts/src";
import { uploadSafetyCostEvidenceDraft } from "../lib/safety-cost-actions";
import { StatusBadge } from "./status-badge";

type SafetyCostEvidenceUploaderProps = {
  usageId: string;
  evidenceItems: SafetyCostEvidence[];
};

export function SafetyCostEvidenceUploader({
  usageId,
  evidenceItems,
}: SafetyCostEvidenceUploaderProps) {
  const firstItem = evidenceItems[0];
  const [fileId, setFileId] = useState(firstItem?.fileId ?? "");
  const [fileName, setFileName] = useState(firstItem?.fileName ?? "");
  const [storagePath, setStoragePath] = useState(firstItem?.storagePath ?? "");
  const [evidenceType, setEvidenceType] = useState<string>(
    firstItem?.evidenceType ?? "safety_cost_usage_statement",
  );
  const [message, setMessage] = useState("upload 대기");

  async function handleUpload() {
    if (!fileId || !fileName || !storagePath) {
      setMessage("fileId / fileName / storagePath 필요");
      return;
    }
    setMessage("업로드 중");
    try {
      await uploadSafetyCostEvidenceDraft(usageId, {
        fileId,
        fileName,
        storagePath,
        evidenceType,
      });
      setMessage("POST /safety-cost-usages/{id}/evidence/upload");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostEvidenceUploader</p>
          <h3 className="panel-title">증빙파일 연결</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <p className="muted">drag & drop upload, 웹하드 선택, 메일 첨부 가져오기 흐름이 들어갈 자리입니다.</p>
      <p className="muted">현재 연결된 증빙파일 {evidenceItems.length}건</p>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="safety-cost-evidence-file-id">fileId</label>
          <input
            className="fake-input"
            id="safety-cost-evidence-file-id"
            onChange={(event) => setFileId(event.target.value)}
            value={fileId}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-evidence-type">evidenceType</label>
          <input
            className="fake-input"
            id="safety-cost-evidence-type"
            onChange={(event) => setEvidenceType(event.target.value)}
            value={evidenceType}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-evidence-file-name">fileName</label>
          <input
            className="fake-input"
            id="safety-cost-evidence-file-name"
            onChange={(event) => setFileName(event.target.value)}
            value={fileName}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-evidence-storage-path">storagePath</label>
          <input
            className="fake-input"
            id="safety-cost-evidence-storage-path"
            onChange={(event) => setStoragePath(event.target.value)}
            value={storagePath}
          />
        </div>
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleUpload} type="button">
          증빙 업로드 API 호출
        </button>
      </div>
    </section>
  );
}
