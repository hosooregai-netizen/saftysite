"use client";

import { useState } from "react";

import type { EvidencePhoto } from "../../packages/contracts/src";
import { saveEvidencePhotoMarkup } from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type PhotoMarkupEditorProps = {
  photo: EvidencePhoto;
};

export function PhotoMarkupEditor({ photo }: PhotoMarkupEditorProps) {
  const shapeCount = photo.markupInfo?.shapes.length ?? 0;
  const [message, setMessage] = useState("overlay 검토");

  async function handleSaveMarkup() {
    setMessage("저장 중");
    try {
      await saveEvidencePhotoMarkup(photo.id, {
        shapes: photo.markupInfo?.shapes.length
          ? photo.markupInfo.shapes
          : [
              {
                id: `shape-${photo.id}`,
                shapeType: "ellipse",
                x: 0.35,
                y: 0.4,
                width: 0.2,
                height: 0.16,
              },
            ],
      });
      setMessage("POST /evidence-photos/{id}/markup");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Markup Editor</p>
          <h3>노란 점선 타원 강조</h3>
        </div>
        <div className="status-stack">
          <StatusBadge tone={shapeCount > 0 ? "warning" : "info"} label={`마크업 ${shapeCount}개`} />
          <StatusBadge tone="review" label={message} />
        </div>
      </div>
      <p>원본 이미지는 수정하지 않고 overlay metadata만 저장합니다.</p>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleSaveMarkup} type="button">
          마크업 API 호출
        </button>
      </div>
    </section>
  );
}
