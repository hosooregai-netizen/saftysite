"use client";

import { useState } from "react";

import type { SafetyCostUsageDetailResponse } from "../../packages/contracts/src";
import {
  createRoundSafetyCostUsageDraft,
  updateSafetyCostUsageDraft,
} from "../lib/safety-cost-actions";
import { SafetyCostStatusBadge } from "./safety-cost-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyCostUsageFormProps = {
  detail?: SafetyCostUsageDetailResponse;
  title?: string;
  inspectionRoundId?: string;
};

export function SafetyCostUsageForm({
  detail,
  title = "산업안전보건관리비 입력",
  inspectionRoundId,
}: SafetyCostUsageFormProps) {
  const usage = detail?.usage;
  const [ownerPartyId, setOwnerPartyId] = useState(usage?.ownerPartyId ?? "");
  const [calculatedAmount, setCalculatedAmount] = useState(
    usage ? String(usage.calculatedAmount) : "",
  );
  const [usedAmount, setUsedAmount] = useState(usage ? String(usage.usedAmount) : "");
  const [basisMonth, setBasisMonth] = useState(usage?.basisMonth ?? "");
  const [basisDate, setBasisDate] = useState(usage?.basisDate ?? "");
  const [basisDocumentText, setBasisDocumentText] = useState(
    usage?.basisDocumentText ?? "",
  );
  const [appropriatenessComment, setAppropriatenessComment] = useState(
    usage?.appropriatenessComment ?? "",
  );
  const [userEnteredRate, setUserEnteredRate] = useState(
    usage?.userEnteredRate !== undefined && usage?.userEnteredRate !== null
      ? String(usage.userEnteredRate)
      : "",
  );
  const [message, setMessage] = useState("draft 검토");

  async function handleSubmitDraft() {
    const calculated = Number(calculatedAmount);
    const used = Number(usedAmount);
    const enteredRate =
      userEnteredRate.trim().length > 0 ? Number(userEnteredRate) : undefined;
    setMessage("저장 중");
    try {
      if (usage) {
        await updateSafetyCostUsageDraft(usage.id, {
          calculatedAmount: calculated,
          usedAmount: used,
          userEnteredRate: enteredRate,
          basisMonth: basisMonth || null,
          basisDate: basisDate || null,
          basisDocumentText: basisDocumentText || null,
          appropriatenessComment: appropriatenessComment || null,
          appropriatenessStatus: usage.appropriatenessStatus,
          reportInclude: usage.reportInclude,
        });
        setMessage("PATCH /safety-cost-usages/{id}");
        return;
      }
      if (!inspectionRoundId) {
        setMessage("inspectionRoundId 필요");
        return;
      }
      if (!ownerPartyId || !calculatedAmount || !usedAmount) {
        setMessage("ownerPartyId / 금액 입력 필요");
        return;
      }
      await createRoundSafetyCostUsageDraft(inspectionRoundId, {
        ownerPartyId,
        calculatedAmount: calculated,
        usedAmount: used,
        userEnteredRate: enteredRate,
        basisMonth: basisMonth || null,
        basisDate: basisDate || null,
        basisDocumentText: basisDocumentText || null,
        appropriatenessComment: appropriatenessComment || null,
      });
      setMessage("POST /inspection-rounds/{id}/safety-cost-usages");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="panel safety-cost-form-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostUsageForm</p>
          <h3 className="panel-title">{title}</h3>
          <p className="muted">발주처별 계상금액, 사용금액, 기준월, 관련근거, 적정성 의견을 한 화면에서 검토합니다.</p>
        </div>
        <div className="status-stack">
          {usage ? <SafetyCostStatusBadge status={usage.status} /> : null}
          <StatusBadge tone="review" label={message} />
        </div>
      </div>
      <div className="safety-cost-form-grid">
        <div className="safety-cost-form-highlight">
          <span>계상금액</span>
          <strong>{usage ? `${usage.calculatedAmount.toLocaleString()}원` : "미입력"}</strong>
        </div>
        <div className="safety-cost-form-highlight">
          <span>사용금액</span>
          <strong>{usage ? `${usage.usedAmount.toLocaleString()}원` : "미입력"}</strong>
        </div>
        <div className="safety-cost-form-highlight">
          <span>계산 사용률</span>
          <strong>{usage ? `${usage.usedRateCalculated.toFixed(1)}%` : "-"}</strong>
        </div>
        <div className="safety-cost-form-highlight">
          <span>입력 사용률</span>
          <strong>
            {usage?.userEnteredRate !== undefined && usage?.userEnteredRate !== null ? `${usage.userEnteredRate.toFixed(1)}%` : "optional"}
          </strong>
        </div>
      </div>
      <dl className="detail-grid safety-cost-form-detail">
        <div>
          <dt>발주처</dt>
          <dd>{detail?.ownerDisplayName ?? "발주처 선택 필요"}</dd>
        </div>
        <div>
          <dt>기준월 / 기준일</dt>
          <dd>{usage?.basisMonth ?? usage?.basisDate ?? "미입력"}</dd>
        </div>
        <div>
          <dt>관련근거</dt>
          <dd>{usage?.basisDocumentText ?? "미입력"}</dd>
        </div>
        <div>
          <dt>적정성 상태</dt>
          <dd>{usage?.appropriatenessStatus ?? "not_reviewed"}</dd>
        </div>
        <div>
          <dt>적정성 의견</dt>
          <dd>{usage?.appropriatenessComment ?? "검토 의견 미입력"}</dd>
        </div>
      </dl>
      <div className="form-grid">
        {!usage ? (
          <div className="form-field span-2">
            <label htmlFor="safety-cost-owner-party-id">ownerPartyId</label>
            <input
              className="fake-input"
              id="safety-cost-owner-party-id"
              onChange={(event) => setOwnerPartyId(event.target.value)}
              value={ownerPartyId}
            />
          </div>
        ) : null}
        <div className="form-field">
          <label htmlFor="safety-cost-calculated-amount">계상금액</label>
          <input
            className="fake-input"
            id="safety-cost-calculated-amount"
            onChange={(event) => setCalculatedAmount(event.target.value)}
            value={calculatedAmount}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-used-amount">사용금액</label>
          <input
            className="fake-input"
            id="safety-cost-used-amount"
            onChange={(event) => setUsedAmount(event.target.value)}
            value={usedAmount}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-user-entered-rate">입력 사용률</label>
          <input
            className="fake-input"
            id="safety-cost-user-entered-rate"
            onChange={(event) => setUserEnteredRate(event.target.value)}
            value={userEnteredRate}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-basis-month">기준월</label>
          <input
            className="fake-input"
            id="safety-cost-basis-month"
            onChange={(event) => setBasisMonth(event.target.value)}
            value={basisMonth}
          />
        </div>
        <div className="form-field">
          <label htmlFor="safety-cost-basis-date">기준일</label>
          <input
            className="fake-input"
            id="safety-cost-basis-date"
            onChange={(event) => setBasisDate(event.target.value)}
            value={basisDate}
          />
        </div>
        <div className="form-field span-2">
          <label htmlFor="safety-cost-basis-document">관련근거</label>
          <textarea
            className="fake-input"
            id="safety-cost-basis-document"
            onChange={(event) => setBasisDocumentText(event.target.value)}
            rows={2}
            value={basisDocumentText}
          />
        </div>
        <div className="form-field span-2">
          <label htmlFor="safety-cost-appropriateness-comment">적정성 의견</label>
          <textarea
            className="fake-input"
            id="safety-cost-appropriateness-comment"
            onChange={(event) => setAppropriatenessComment(event.target.value)}
            rows={3}
            value={appropriatenessComment}
          />
        </div>
      </div>
      <div className="badge-row">
        <StatusBadge tone="info" label="사용률 자동 계산" />
        <StatusBadge tone="review" label="AI 의견은 초안" />
        <StatusBadge tone="warning" label="확정 전 증빙 확인" />
      </div>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleSubmitDraft} type="button">
          {usage ? "안전관리비 수정 API 호출" : "안전관리비 생성 API 호출"}
        </button>
      </div>
    </section>
  );
}
