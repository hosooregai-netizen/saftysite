"use client";

import { useState } from "react";

import { uploadFindingEvidencePhoto } from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type PhotoUploaderProps = {
  findingId: string;
};

export function PhotoUploader({ findingId }: PhotoUploaderProps) {
  const [message, setMessage] = useState("업로드 대기");

  async function handleUpload() {
    setMessage("업로드 중");
    try {
      await uploadFindingEvidencePhoto(findingId, {
        fileId: `draft-file-${findingId}`,
        fileName: `${findingId}-draft-photo.jpg`,
        storagePath: `/draft/findings/${findingId}-draft-photo.jpg`,
        photoType: "finding_photo",
        caption: "현장 증빙 초안",
      });
      setMessage("POST /findings/{id}/photos/upload");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Uploader</p>
          <h3>증빙 사진 업로드</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <p>지적사진/조치사진은 `findingId={findingId}`에 연결되어 Webhard `02_지적사항` 폴더 구조로 관리됩니다.</p>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleUpload} type="button">
          사진 업로드 API 호출
        </button>
      </div>
    </section>
  );
}
