"use client";

import { useState } from "react";

import type { SafetyCostValidationWarning } from "../../packages/contracts/src";
import { validateSafetyCostUsageDraft } from "../lib/safety-cost-actions";
import { StatusBadge } from "./status-badge";

type SafetyCostWarningPanelProps = {
  usageId?: string;
  warnings: SafetyCostValidationWarning[];
};

export function SafetyCostWarningPanel({
  usageId,
  warnings,
}: SafetyCostWarningPanelProps) {
  const [localWarnings, setLocalWarnings] = useState(warnings);
  const [message, setMessage] = useState("검토 대기");

  async function handleValidate() {
    if (!usageId) {
      setMessage("usageId 필요");
      return;
    }
    setMessage("검증 중");
    try {
      const response = await validateSafetyCostUsageDraft(usageId);
      setLocalWarnings(response.warnings);
      setMessage("POST /safety-cost-usages/{id}/validate");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  if (!localWarnings.length) {
    return (
      <section className="panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">SafetyCostWarningPanel</p>
            <h3 className="panel-title">검증 경고</h3>
          </div>
          <StatusBadge tone="success" label="경고 없음" />
        </div>
        <p className="muted">현재 검토 기준으로 표시할 경고가 없습니다.</p>
        {usageId ? (
          <div className="link-list">
            <button className="inline-link button-reset" onClick={handleValidate} type="button">
              검증 API 호출
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="panel safety-cost-warning-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostWarningPanel</p>
          <h3 className="panel-title">검증 경고</h3>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="section-stack">
        {localWarnings.map((warning) => (
          <div className={`missing-item safety-cost-warning-item ${warning.severity}`} key={`${warning.type}-${warning.message}`}>
            <strong>{warning.type}</strong>
            <span>{warning.message}</span>
          </div>
        ))}
      </div>
      {usageId ? (
        <div className="link-list">
          <button className="inline-link button-reset" onClick={handleValidate} type="button">
            검증 API 호출
          </button>
        </div>
      ) : null}
    </section>
  );
}
