"use client";

import { useState } from "react";

import type { PhotoLedgerEntry } from "../../packages/contracts/src";
import { updatePhotoLedgerEntryDraft } from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type PhotoPairMatcherProps = {
  entries: PhotoLedgerEntry[];
};

export function PhotoPairMatcher({ entries }: PhotoPairMatcherProps) {
  const [message, setMessage] = useState("매칭 검토");

  async function handleToggleConfirmed(entry: PhotoLedgerEntry) {
    setMessage("저장 중");
    try {
      await updatePhotoLedgerEntryDraft(entry.id, { confirmed: !entry.confirmed });
      setMessage("PATCH /photo-ledger-entries/{id}");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Pair Matcher</p>
          <h3>전후 사진 짝 구성</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="section-stack">
        {entries.map((entry) => (
          <article className="card muted-card" key={entry.id}>
            <div className="card-head">
              <strong>{entry.findingId}</strong>
              <StatusBadge tone={entry.confirmed ? "success" : "warning"} label={entry.confirmed ? "확정" : "검토"} />
            </div>
            <p className="table-subtext">지적사진: {entry.findingPhotoId ?? "미연결"} / 조치사진: {entry.actionPhotoId ?? "미연결"}</p>
            <div className="link-list">
              <button className="inline-link button-reset" onClick={() => handleToggleConfirmed(entry)} type="button">
                매칭 상태 API 호출
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
