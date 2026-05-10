"use client";

import { useMemo, useState } from "react";

import { createAncErpApiClient, getDefaultAncErpApiBaseUrl } from "../../packages/api-client/src";
import type { ContractFileLink } from "../../packages/contracts/src";
import { uploadSignedDocumentFileAction } from "../lib/approval-actions";
import { StatusBadge } from "./status-badge";

export function SignedFileUploader({
  contractId,
  documentId,
  finalFileId,
  signedFileId,
  files = [],
}: {
  contractId?: string;
  documentId?: string;
  finalFileId?: string | null;
  signedFileId?: string | null;
  files?: ContractFileLink[];
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("업로드 대기");
  const api = useMemo(
    () => createAncErpApiClient({ baseUrl: getDefaultAncErpApiBaseUrl() }),
    [],
  );

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }
    setMessage("업로드 중");
    try {
      if (documentId) {
        await uploadSignedDocumentFileAction(documentId, {
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
        });
      } else if (contractId) {
        await api.uploadContractFile(contractId, {
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileCategory: "attachment",
        });
      }
      setMessage("업로드 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  async function handleSetFinal(fileId: string) {
    if (!contractId) {
      return;
    }
    setMessage("최종본 지정 중");
    try {
      await api.setFinalContractFile(contractId, fileId);
      setMessage("최종본 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  async function handleSetSigned(fileId: string) {
    if (!contractId) {
      return;
    }
    setMessage("날인본 지정 중");
    try {
      await api.setSignedContractFile(contractId, fileId);
      setMessage("날인본 API 연결됨");
    } catch {
      setMessage("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SignedFileUploader</p>
          <h3>최종본 / 날인본 연결</h3>
          <p>파일명, 업로드 상태, 웹하드 저장 위치를 함께 확인합니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="link-list">
        <StatusBadge tone={finalFileId ? "success" : "warning"} label={finalFileId ? "최종본 연결됨" : "최종본 필요"} />
        <StatusBadge tone={signedFileId ? "success" : "warning"} label={signedFileId ? "날인본 연결됨" : "날인본 필요"} />
      </div>
      <div className="section-stack" style={{ marginTop: 16 }}>
        <input onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
        <div className="link-list">
          <button className="inline-link button-reset" onClick={handleUpload} type="button">
            날인본 업로드 API 호출
          </button>
        </div>
        {contractId ? files.map((file) => (
          <div className="missing-item" key={file.id}>
            <strong>{file.fileName}</strong>
            <span>{file.storagePath}</span>
            <div className="link-list">
              <button className="inline-link button-reset" onClick={() => handleSetFinal(file.id)} type="button">
                최종본 지정
              </button>
              <button className="inline-link button-reset" onClick={() => handleSetSigned(file.id)} type="button">
                날인본 지정
              </button>
            </div>
          </div>
        )) : null}
      </div>
    </section>
  );
}
