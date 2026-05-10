"use client";

import { useState } from "react";

import type { FileClassificationSuggestion } from "../../packages/contracts/src";
import { classifyWebhardFileDraft } from "../lib/webhard-actions";

export function FileClassificationSuggestionPanel({
  fileId,
  suggestion,
}: {
  fileId: string;
  suggestion?: FileClassificationSuggestion | null;
}) {
  const [currentSuggestion, setCurrentSuggestion] = useState(suggestion ?? null);
  const [status, setStatus] = useState(suggestion ? "loaded" : "idle");

  async function handleRefresh() {
    setStatus("classifying");
    const response = await classifyWebhardFileDraft(fileId);
    setCurrentSuggestion(response.suggestion);
    setStatus("ready");
  }

  if (!currentSuggestion) {
    return (
      <section className="panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">FileClassificationSuggestionPanel</p>
            <h3 className="panel-title">AI 분류 추천</h3>
          </div>
          <span className="pill outline">{status}</span>
        </div>
        <button className="secondary-button" onClick={handleRefresh} type="button">
          분류 추천 생성
        </button>
      </section>
    );
  }
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FileClassificationSuggestionPanel</p>
          <h3 className="panel-title">AI 분류 추천</h3>
        </div>
        <span className="pill outline">{status}</span>
      </div>
      <p>추천 폴더: {currentSuggestion.recommendedFolderPath ?? "-"}</p>
      <p>추천 태그: {currentSuggestion.recommendedTags.join(", ") || "-"}</p>
      <p>신뢰도: {Math.round(currentSuggestion.confidence * 100)}%</p>
      <p>{currentSuggestion.rationale}</p>
      <button className="secondary-button" onClick={handleRefresh} type="button">
        추천 다시 계산
      </button>
    </section>
  );
}
