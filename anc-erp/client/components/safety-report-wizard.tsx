"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  InspectionRoundListItem,
  SafetyReportRequiredDataResponse,
} from "../../packages/contracts/src";
import {
  createSafetyReportDraftAction,
  getSafetyReportOwnerBranchesAction,
  getSafetyReportRequiredDataAction,
} from "../lib/safety-report-actions";
import { StatusBadge } from "./status-badge";

type SafetyReportWizardProps = {
  projectId: string;
  inspectionRounds: InspectionRoundListItem[];
  requiredData: SafetyReportRequiredDataResponse;
};

export function InspectionRoundSelector({
  rounds,
  value,
  onChange,
}: {
  rounds: InspectionRoundListItem[];
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="ops-item">
      <strong>점검회차</strong>
      <select className="select-field" onChange={(event) => onChange(event.target.value)} value={value}>
        {rounds.map((item) => (
          <option key={item.round.id} value={item.round.id}>
            {item.round.name} · {item.round.roundNo}회
          </option>
        ))}
      </select>
    </label>
  );
}

export function OwnerPartySelector({
  ownerBranches,
  value,
  onChange,
}: {
  ownerBranches: SafetyReportRequiredDataResponse["ownerBranches"];
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="ops-item">
      <strong>발주처</strong>
      <select className="select-field" onChange={(event) => onChange(event.target.value)} value={value}>
        {ownerBranches.map((branch) => (
          <option key={branch.ownerPartyId} value={branch.ownerPartyId}>
            {branch.ownerDisplayName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ReportTemplateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="ops-item">
      <strong>템플릿</strong>
      <select className="select-field" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="template-safety-report-v1">template-safety-report-v1</option>
      </select>
    </label>
  );
}

export function ReportGenerateButton({
  documentId,
}: {
  documentId?: string;
}) {
  return (
    <div className="ops-item">
      <strong>생성 모드</strong>
      <span>{documentId ? `기존 문서 ${documentId}` : "linked data 초안 생성"}</span>
    </div>
  );
}

export function SafetyReportWizard({
  projectId,
  inspectionRounds,
  requiredData: initialRequiredData,
}: SafetyReportWizardProps) {
  const [requiredData, setRequiredData] = useState(initialRequiredData);
  const [selectedRoundId, setSelectedRoundId] = useState(initialRequiredData.inspectionRoundId);
  const [selectedOwnerPartyId, setSelectedOwnerPartyId] = useState(
    initialRequiredData.ownerBranches[0]?.ownerPartyId ?? "",
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("template-safety-report-v1");
  const [result, setResult] = useState<string>("");

  const steps = [
    "회차 확인",
    "발주처 branch 선택",
    "linked data 점검",
    "draft 생성",
    "섹션 편집",
    "export / 제출",
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadRoundData() {
      const [nextRequiredData, nextOwnerBranches] = await Promise.all([
        getSafetyReportRequiredDataAction(selectedRoundId),
        getSafetyReportOwnerBranchesAction(selectedRoundId),
      ]);
      if (cancelled) {
        return;
      }
      const mergedRequiredData = {
        ...nextRequiredData,
        ownerBranches: nextOwnerBranches,
      };
      setRequiredData(mergedRequiredData);
      setSelectedOwnerPartyId(nextOwnerBranches[0]?.ownerPartyId ?? "");
    }

    if (selectedRoundId) {
      void loadRoundData();
    }

    return () => {
      cancelled = true;
    };
  }, [selectedRoundId]);

  const selectedBranch = useMemo(
    () =>
      requiredData.ownerBranches.find((branch) => branch.ownerPartyId === selectedOwnerPartyId) ??
      requiredData.ownerBranches[0],
    [requiredData.ownerBranches, selectedOwnerPartyId],
  );

  async function handleCreateDraft() {
    if (!selectedBranch) return;
    const response = await createSafetyReportDraftAction({
      projectId,
      inspectionRoundId: selectedRoundId,
      ownerPartyId: selectedBranch.ownerPartyId,
      ownerReportTaskId: selectedBranch.ownerReportTaskId,
      templateId: selectedTemplateId,
      generationMode: "from_linked_data",
    });
    setResult(response.document.id);
  }

  return (
    <section className="panel report-wizard-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyReportWizard</p>
          <h3 className="panel-title">발주처별 보고서 초안 생성</h3>
        </div>
        {result ? <StatusBadge tone="success" label={result} /> : null}
      </div>
      <div className="report-step-strip" aria-label="보고서 생성 단계">
        {steps.map((step, index) => (
          <article className="report-step-item" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </article>
        ))}
      </div>
      <div className="ops-card-list report-wizard-grid">
        <InspectionRoundSelector
          rounds={inspectionRounds}
          value={selectedRoundId}
          onChange={setSelectedRoundId}
        />
        <OwnerPartySelector
          ownerBranches={requiredData.ownerBranches}
          value={selectedOwnerPartyId}
          onChange={setSelectedOwnerPartyId}
        />
        <ReportTemplateSelector value={selectedTemplateId} onChange={setSelectedTemplateId} />
        <ReportGenerateButton />
      </div>
      <div className="report-branch-strip">
        {requiredData.ownerBranches.map((branch) => (
          <div className="micro-pill owner" key={branch.ownerPartyId}>
            {branch.ownerDisplayName}
          </div>
        ))}
      </div>
      <div className="report-export-summary">
        <div className="kv-card">
          <strong>필수 데이터</strong>
          <span>{requiredData.requiredData.length}건</span>
        </div>
        <div className="kv-card">
          <strong>검토 경고</strong>
          <span>{requiredData.warnings.length}건</span>
        </div>
      </div>
      <p className="helper-text">
        생성 시 linked data 기준 draft snapshot을 만들고, 이후 섹션별 저장본만 export 대상으로 사용합니다.
      </p>
      <button className="primary-button" onClick={handleCreateDraft} type="button">
        초안 생성
      </button>
    </section>
  );
}
