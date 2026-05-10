"use client";

import { useState } from "react";

import type { SafetyManagementWorkType } from "../../packages/contracts/src";
import { createSafetyManagementRiskDraft } from "../lib/safety-management-plan-actions";

export function RiskItemForm({
  planId,
  workTypes,
}: {
  planId: string;
  workTypes: SafetyManagementWorkType[];
}) {
  const [workTypeId, setWorkTypeId] = useState(workTypes[0]?.id ?? "");
  const [hazard, setHazard] = useState("");
  const [reductionMeasure, setReductionMeasure] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");

  async function handleCreate() {
    if (!hazard.trim() || !reductionMeasure.trim()) {
      return;
    }
    const selectedWorkType = workTypes.find((item) => item.id === workTypeId);
    await createSafetyManagementRiskDraft(planId, {
      workTypeId: selectedWorkType?.id ?? null,
      workTypeName: selectedWorkType?.name ?? null,
      hazard: hazard.trim(),
      reductionMeasure: reductionMeasure.trim(),
      riskLevel,
      sourceType: "manual",
    });
    setHazard("");
    setReductionMeasure("");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RiskItemForm</p>
          <h3 className="panel-title">위험요인 추가</h3>
        </div>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>공종</span>
          <select className="select-field" onChange={(event) => setWorkTypeId(event.target.value)} value={workTypeId}>
            <option value="">공종 미지정</option>
            {workTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>위험도</span>
          <select className="select-field" onChange={(event) => setRiskLevel(event.target.value)} value={riskLevel}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label className="form-field span-2">
          <span>유해·위험요인</span>
          <textarea className="fake-input" onChange={(event) => setHazard(event.target.value)} rows={3} value={hazard} />
        </label>
        <label className="form-field span-2">
          <span>감소대책</span>
          <textarea className="fake-input" onChange={(event) => setReductionMeasure(event.target.value)} rows={3} value={reductionMeasure} />
        </label>
        <div className="inline-actions">
          <button className="secondary-button" onClick={handleCreate} type="button">
            위험요인 저장
          </button>
        </div>
      </div>
    </section>
  );
}
