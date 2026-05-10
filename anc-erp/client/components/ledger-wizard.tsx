"use client";

import { useState } from "react";

import { createSafetyHealthLedgerDraftAction } from "../lib/safety-health-ledger-actions";

export function LedgerWizard({ projectId }: { projectId: string }) {
  const [templateId, setTemplateId] = useState("template-safety-health-ledger-v1");
  const [sourcePlanId, setSourcePlanId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const steps = [
    "1. 프로젝트 확인",
    "2. 템플릿 선택",
    "3. 안전관리계획서 연결",
    "4. 위험요인 가져오기",
    "5. 점검/지적/산안비 데이터 연결",
    "6. 누락정보 확인",
    "7. 초안 생성",
  ];

  async function handleCreate() {
    await createSafetyHealthLedgerDraftAction(projectId, {
      projectId,
      templateId,
      sourcePlanId: sourcePlanId || undefined,
      includeInspectionHistory: true,
      includeFindingHistory: true,
      includeSafetyCostHistory: true,
    });
    setMessage("POST /projects/{projectId}/safety-health-ledgers");
  }

  return (
    <section className="panel plan-wizard-card ledger-wizard-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerWizard</p>
          <h3 className="panel-title">안전보건대장 생성</h3>
          <p className="card-copy">프로젝트 장기 누적 원장을 만드는 흐름입니다. 회차별 보고서와 분리해서 생각하세요.</p>
        </div>
      </div>
      <div className="report-step-strip ledger-step-strip">
        {steps.map((step, index) => (
          <article className="report-step-item" key={step}>
            <span>{index + 1}</span>
            <strong>{step.replace(/^\d+\.\s/, "")}</strong>
          </article>
        ))}
      </div>
      <div className="ops-card-list">
        <article className="ops-item">
          <strong>templateId</strong>
          <select className="fake-input" onChange={(event) => setTemplateId(event.target.value)} value={templateId}>
            <option value="template-safety-health-ledger-v1">template-safety-health-ledger-v1</option>
          </select>
        </article>
        <article className="ops-item">
          <strong>sourcePlanId</strong>
          <input
            className="fake-input"
            onChange={(event) => setSourcePlanId(event.target.value)}
            placeholder="선택한 안전관리계획서 ID"
            value={sourcePlanId}
          />
        </article>
      </div>
      <div className="inline-actions">
        <button className="primary-button" onClick={handleCreate} type="button">초안 생성</button>
      </div>
      {message ? <p className="form-helper">{message}</p> : null}
    </section>
  );
}
