"use client";

import { useState } from "react";

import type { SafetyCostUsageDetailResponse } from "../../packages/contracts/src";
import { generateSafetyCostCommentDraft } from "../lib/safety-cost-actions";
import { StatusBadge } from "./status-badge";

type SafetyCostCommentGeneratorPanelProps = {
  detail: SafetyCostUsageDetailResponse;
};

export function SafetyCostCommentGeneratorPanel({
  detail,
}: SafetyCostCommentGeneratorPanelProps) {
  const latestAiDraft = [...detail.reviews].reverse().find((review) => review.aiDraftComment);
  const [draftText, setDraftText] = useState(
    latestAiDraft?.aiDraftComment ??
      "적정성 초안이 아직 생성되지 않았습니다.",
  );
  const [message, setMessage] = useState("AI 초안 대기");

  async function handleGenerate() {
    setMessage("초안 생성 중");
    try {
      const response = await generateSafetyCostCommentDraft(detail.usage.id);
      setDraftText(
        response.review.aiDraftComment ??
          response.review.reviewComment ??
          draftText,
      );
      setMessage("POST /safety-cost-usages/{id}/generate-comment");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostCommentGeneratorPanel</p>
          <h3 className="panel-title">적정성 의견 초안</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <p>{draftText}</p>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleGenerate} type="button">
          적정성 초안 API 호출
        </button>
      </div>
    </section>
  );
}
