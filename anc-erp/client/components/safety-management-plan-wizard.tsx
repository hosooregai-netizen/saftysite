"use client";

import { useState } from "react";

import { createSafetyManagementPlanDraftAction } from "../lib/safety-management-plan-actions";
import { StatusBadge } from "./status-badge";

export function SafetyManagementPlanWizard({ projectId }: { projectId: string }) {
  const [result, setResult] = useState<string>("");
  const [templateId, setTemplateId] = useState("template-safety-management-plan-v1");
  const [contractId, setContractId] = useState("");
  const [inspectionRoundId, setInspectionRoundId] = useState("");
  const [generationMode, setGenerationMode] = useState("from_project_snapshot");
  const steps = [
    "템플릿 선택",
    "프로젝트/계약 정보 확인",
    "공정표/첨부자료 연결",
    "주요 공종 선택",
    "위험요인 후보 생성",
    "누락정보 확인",
    "초안 생성",
  ];

  async function handleCreate() {
    const response = await createSafetyManagementPlanDraftAction(projectId, {
      projectId,
      templateId,
      contractId: contractId.trim() || undefined,
      inspectionRoundId: inspectionRoundId.trim() || undefined,
      generationMode,
    });
    setResult(response.plan.id);
  }

  return (
    <section className="panel report-wizard-card plan-wizard-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyManagementPlanWizard</p>
          <h3 className="panel-title">안전관리계획서 초안 생성</h3>
        </div>
        {result ? <StatusBadge tone="success" label={result} /> : null}
      </div>
      <div className="report-step-strip plan-step-strip" aria-label="계획서 생성 단계">
        {steps.map((step, index) => (
          <article className="report-step-item" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </article>
        ))}
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>템플릿</span>
          <select className="select-field" onChange={(event) => setTemplateId(event.target.value)} value={templateId}>
            <option value="template-safety-management-plan-v1">표준 v1</option>
          </select>
        </label>
        <label className="form-field">
          <span>생성 모드</span>
          <select className="select-field" onChange={(event) => setGenerationMode(event.target.value)} value={generationMode}>
            <option value="from_project_snapshot">project snapshot</option>
            <option value="from_manual_review">manual review</option>
          </select>
        </label>
        <label className="form-field">
          <span>contractId</span>
          <input
            className="fake-input"
            onChange={(event) => setContractId(event.target.value)}
            placeholder="선택 사항"
            value={contractId}
          />
        </label>
        <label className="form-field">
          <span>inspectionRoundId</span>
          <input
            className="fake-input"
            onChange={(event) => setInspectionRoundId(event.target.value)}
            placeholder="개정본 연결 시 입력"
            value={inspectionRoundId}
          />
        </label>
      </div>
      <div className="ops-card-list report-wizard-grid">
        <article className="ops-item">
          <strong>생성 기준</strong>
          <span>Project snapshot + optional contract + optional inspection round</span>
        </article>
        <article className="ops-item">
          <strong>템플릿</strong>
          <span>{templateId}</span>
        </article>
        <article className="ops-item">
          <strong>첨부자료</strong>
          <span>공정표, 조직도, 교육자료 연결 여부를 생성 전에 확인합니다.</span>
        </article>
        <article className="ops-item">
          <strong>위험요인 후보</strong>
          <span>주요 공종을 기준으로 draft 위험요인 register를 시작점으로 만듭니다.</span>
        </article>
      </div>
      <div className="report-export-summary">
        <div className="kv-card">
          <strong>법정 문구</strong>
          <span>template section 고정</span>
        </div>
        <div className="kv-card">
          <strong>AI 생성</strong>
          <span>draft only</span>
        </div>
      </div>
      <p className="helper-text">법정 문구는 template section을 기준으로 유지하고, AI 생성 문구는 draft로만 표시합니다.</p>
      <div className="inline-actions">
        <button className="primary-button" disabled={!templateId} onClick={handleCreate} type="button">
          초안 생성
        </button>
      </div>
    </section>
  );
}
