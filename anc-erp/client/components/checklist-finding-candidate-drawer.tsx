"use client";

import { useState } from "react";

import type { FindingCandidate } from "../../packages/contracts/src";
import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function ChecklistFindingCandidateDrawer({ candidate }: { candidate: FindingCandidate }) {
  const [message, setMessage] = useState("후보 검토");

  async function handleConvert() {
    setMessage("전환 중");
    try {
      const api = createBrowserApiClient();
      await api.convertChecklistFindingCandidate(candidate.id);
      setMessage("POST /convert-to-finding");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistFindingCandidateDrawer</p>
          <h3>{candidate.title}</h3>
        </div>
        <StatusBadge tone="warning" label={candidate.status} />
      </div>
      <p>{candidate.detail}</p>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleConvert} type="button">
          정식 Finding 전환 API
        </button>
      </div>
      <StatusBadge tone="review" label={message} />
    </section>
  );
}
