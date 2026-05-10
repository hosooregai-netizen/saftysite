"use client";

import { useState } from "react";

import type { EvidencePhoto } from "../../packages/contracts/src";
import {
  markEvidencePhotoRepresentative,
  saveEvidencePhotoCaption,
} from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type PhotoCaptionEditorProps = {
  photo: EvidencePhoto;
};

export function PhotoCaptionEditor({ photo }: PhotoCaptionEditorProps) {
  const [message, setMessage] = useState("캡션 검토");

  async function handleSaveCaption() {
    setMessage("저장 중");
    try {
      await saveEvidencePhotoCaption(photo.id, photo.caption ?? "현장 사진 캡션 초안");
      setMessage("POST /evidence-photos/{id}/set-caption");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  async function handleSetRepresentative() {
    setMessage("대표 지정 중");
    try {
      await markEvidencePhotoRepresentative(photo.id);
      setMessage("POST /evidence-photos/{id}/set-representative");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Caption Editor</p>
          <h3>캡션 / 대표사진 설정</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <p>{photo.caption ?? "캡션 미입력"}</p>
      <p className="table-subtext">대표사진: {photo.representative ? "예" : "아니오"}</p>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleSaveCaption} type="button">
          캡션 API 호출
        </button>
        <button className="inline-link button-reset" onClick={handleSetRepresentative} type="button">
          대표사진 API 호출
        </button>
      </div>
    </section>
  );
}
