"use client";

import { useState } from "react";

import type { ChecklistResultValue } from "../../packages/contracts/src";
import { createBrowserApiClient } from "../lib/api";
import { StatusBadge } from "./status-badge";

const OPTIONS: ChecklistResultValue[] = ["good", "caution", "bad", "not_applicable", "not_checked"];

export function ChecklistResultRadioGroup({
  resultId,
  value,
}: {
  resultId: string;
  value: ChecklistResultValue;
}) {
  const [message, setMessage] = useState<string>(value);

  async function handleSelect(nextValue: ChecklistResultValue) {
    setMessage("저장 중");
    try {
      const api = createBrowserApiClient();
      await api.updateChecklistResult(resultId, { result: nextValue });
      setMessage(`PATCH ${nextValue}`);
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <div className="section-stack">
      <div className="badge-row">
        {OPTIONS.map((option) => (
          <button className="inline-link button-reset" key={option} onClick={() => handleSelect(option)} type="button">
            {option}
          </button>
        ))}
      </div>
      <StatusBadge tone="review" label={message} />
    </div>
  );
}
