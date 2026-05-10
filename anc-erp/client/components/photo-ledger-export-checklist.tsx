"use client";

import { useState } from "react";

import type { PhotoLedgerWarning } from "../../packages/contracts/src";
import { validatePhotoLedgerDraft } from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type PhotoLedgerExportChecklistProps = {
  photoLedgerId: string;
  warnings: PhotoLedgerWarning[];
};

export function PhotoLedgerExportChecklist({ photoLedgerId, warnings }: PhotoLedgerExportChecklistProps) {
  const [message, setMessage] = useState("검토 대기");
  const [localWarnings, setLocalWarnings] = useState(warnings);

  async function handleValidate() {
    setMessage("검증 중");
    try {
      const response = await validatePhotoLedgerDraft(photoLedgerId);
      setLocalWarnings(response.warnings);
      setMessage("POST /photo-ledgers/{id}/validate");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Ledger Export Checklist</p>
          <h3>export 전 검토</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="section-stack">
        {localWarnings.length === 0 ? (
          <StatusBadge tone="success" label="경고 없음" />
        ) : (
          localWarnings.map((warning) => (
            <article className="card muted-card" key={warning.id}>
              <div className="card-head">
                <strong>{warning.code}</strong>
                <StatusBadge tone={warning.severity === "danger" ? "danger" : "warning"} label={warning.severity} />
              </div>
              <p>{warning.message}</p>
            </article>
          ))
        )}
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleValidate} type="button">
          export 검증 API 호출
        </button>
      </div>
    </section>
  );
}
