"use client";

import { useState } from "react";

import type { SafetyCostReview, SafetyCostUsage } from "../../packages/contracts/src";
import {
  confirmSafetyCostUsageDraft,
  reviewSafetyCostUsageDraft,
} from "../lib/safety-cost-actions";
import { SafetyCostStatusBadge } from "./safety-cost-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyCostReviewPanelProps = {
  usage: SafetyCostUsage;
  reviews: SafetyCostReview[];
};

export function SafetyCostReviewPanel({ usage, reviews }: SafetyCostReviewPanelProps) {
  const latestAiDraft = [...reviews].reverse().find((review) => review.aiDraftComment);
  const latestHumanReview = [...reviews]
    .reverse()
    .find((review) => review.reviewerId !== "ai-draft");
  const [reviewerId, setReviewerId] = useState("");
  const [reviewComment, setReviewComment] = useState(
    latestHumanReview?.reviewComment ?? usage.appropriatenessComment ?? "",
  );
  const [appropriatenessStatus, setAppropriatenessStatus] = useState<string>(
    usage.appropriatenessStatus,
  );
  const [confirmedBy, setConfirmedBy] = useState(usage.confirmedBy ?? "");
  const [message, setMessage] = useState("검토 대기");

  async function handleReview() {
    if (!reviewerId || !reviewComment) {
      setMessage("reviewerId / reviewComment 필요");
      return;
    }
    setMessage("검토 저장 중");
    try {
        await reviewSafetyCostUsageDraft(usage.id, {
          reviewerId,
          reviewComment,
          appropriatenessStatus,
          aiDraftComment: latestAiDraft?.aiDraftComment ?? null,
        });
      setMessage("POST /safety-cost-usages/{id}/review");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  async function handleConfirm() {
    if (!confirmedBy) {
      setMessage("confirmedBy 필요");
      return;
    }
    setMessage("확정 중");
    try {
      await confirmSafetyCostUsageDraft(usage.id, { confirmedBy });
      setMessage("POST /safety-cost-usages/{id}/confirm");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="panel safety-cost-review-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostReviewPanel</p>
          <h3 className="panel-title">검토 / 확정</h3>
        </div>
        <div className="status-stack">
          <SafetyCostStatusBadge status={usage.status} />
          <StatusBadge tone="review" label={message} />
        </div>
      </div>
      <div className="detail-grid safety-cost-review-grid">
        <div>
          <dt>적정성 상태</dt>
          <dd>{usage.appropriatenessStatus}</dd>
        </div>
        <div>
          <dt>확정자 / 일시</dt>
          <dd>{usage.confirmedBy ? `${usage.confirmedBy} · ${usage.confirmedAt?.slice(0, 10)}` : "미확정"}</dd>
        </div>
      </div>
      <div className="safety-cost-comment-box ai">
        <strong>AI 초안</strong>
        <p>{latestAiDraft?.aiDraftComment ?? "AI 초안이 아직 생성되지 않았습니다."}</p>
      </div>
      <div className="safety-cost-comment-box final">
        <strong>확정 의견</strong>
        <p>{latestHumanReview?.reviewComment ?? usage.appropriatenessComment ?? "검토 의견 없음"}</p>
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="safety-cost-reviewer-id">reviewerId</label>
          <input
            className="fake-input"
            id="safety-cost-reviewer-id"
            onChange={(event) => setReviewerId(event.target.value)}
            value={reviewerId}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-appropriateness-status">appropriatenessStatus</label>
          <input
            className="fake-input"
            id="safety-cost-appropriateness-status"
            onChange={(event) => setAppropriatenessStatus(event.target.value)}
            value={appropriatenessStatus}
          />
        </div>
        <div className="form-field span-2">
          <label htmlFor="safety-cost-review-comment">reviewComment</label>
          <textarea
            className="fake-input"
            id="safety-cost-review-comment"
            onChange={(event) => setReviewComment(event.target.value)}
            rows={3}
            value={reviewComment}
          />
        </div>
        <div className="form-field span-2">
          <label htmlFor="safety-cost-confirmed-by">confirmedBy</label>
          <input
            className="fake-input"
            id="safety-cost-confirmed-by"
            onChange={(event) => setConfirmedBy(event.target.value)}
            value={confirmedBy}
          />
        </div>
      </div>
      <div className="button-row">
        <StatusBadge tone="review" label="AI 초안과 최종 의견 분리" />
        {usage.confirmedAt ? <StatusBadge tone="success" label={`확정 ${usage.confirmedAt.slice(0, 10)}`} /> : null}
        {!usage.confirmedAt ? <StatusBadge tone="warning" label="확정 대기" /> : null}
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleReview} type="button">
          검토 저장 API 호출
        </button>
        <button className="inline-link button-reset" onClick={handleConfirm} type="button">
          확정 API 호출
        </button>
      </div>
    </section>
  );
}
