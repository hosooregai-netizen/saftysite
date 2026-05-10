"use client";

import { useState } from "react";

import { calculateSafetyCostRateDraft } from "../lib/safety-cost-actions";
import { StatusBadge } from "./status-badge";

type SafetyCostUsageRateGaugeProps = {
  usageId?: string;
  calculatedRate: number;
  enteredRate?: number | null;
};

export function SafetyCostUsageRateGauge({
  usageId,
  calculatedRate,
  enteredRate,
}: SafetyCostUsageRateGaugeProps) {
  const [message, setMessage] = useState("자동 계산값");
  const mismatch =
    enteredRate !== undefined &&
    enteredRate !== null &&
    Number(enteredRate.toFixed(1)) !== Number(calculatedRate.toFixed(1));

  async function handleCalculate() {
    if (!usageId) {
      setMessage("usageId 필요");
      return;
    }
    setMessage("계산 중");
    try {
      await calculateSafetyCostRateDraft(usageId);
      setMessage("POST /safety-cost-usages/{id}/calculate-rate");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostUsageRateGauge</p>
          <h3 className="panel-title">사용률 계산</h3>
        </div>
        <div className="status-stack">
          <strong>{calculatedRate.toFixed(1)}%</strong>
          <StatusBadge tone="review" label={message} />
        </div>
      </div>
      <div className="progress-shell">
        <div className="progress-fill" style={{ width: `${Math.min(calculatedRate, 100)}%` }} />
      </div>
      <p className="muted">
        시스템 계산값 {calculatedRate.toFixed(1)}%
        {enteredRate !== undefined && enteredRate !== null ? ` / 입력값 ${enteredRate.toFixed(1)}%` : ""}
      </p>
      {mismatch ? <p className="warning-copy">입력 사용률과 계산 사용률이 다릅니다.</p> : null}
      {usageId ? (
        <div className="link-list">
          <button className="inline-link button-reset" onClick={handleCalculate} type="button">
            사용률 계산 API 호출
          </button>
        </div>
      ) : null}
    </section>
  );
}
