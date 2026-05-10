"use client";

import type { SafetyManagementRiskItem } from "../../packages/contracts/src";
import {
  generateSafetyManagementRisksFromWorkTypesDraft,
  importSafetyManagementRisksFromChecklistDraft,
} from "../lib/safety-management-plan-actions";
import { ReductionMeasureEditor } from "./reduction-measure-editor";
import { RiskItemForm } from "./risk-item-form";
import { RiskMatrixBadge } from "./risk-matrix-badge";
import type { SafetyManagementWorkType } from "../../packages/contracts/src";

export function RiskRegisterTable({
  planId,
  items,
  workTypes,
}: {
  planId: string;
  items: SafetyManagementRiskItem[];
  workTypes: SafetyManagementWorkType[];
}) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RiskRegisterTable</p>
          <h3 className="panel-title">위험요인 register</h3>
        </div>
      </div>
      <div className="report-meta-strip">
        <span>공종: 전체</span>
        <span>위험유형: 전체</span>
        <span>위험도: high 우선</span>
        <span>출처: manual / template / checklist</span>
      </div>
      <RiskItemForm planId={planId} workTypes={workTypes} />
      <div className="inline-actions">
        <button className="secondary-button" onClick={() => void generateSafetyManagementRisksFromWorkTypesDraft(planId)} type="button">공종 기준 생성</button>
        <button className="secondary-button" onClick={() => void importSafetyManagementRisksFromChecklistDraft(planId)} type="button">체크리스트 import</button>
      </div>
      <table className="data-table risk-register-table">
        <thead>
          <tr><th>공종</th><th>유해·위험요인</th><th>감소대책</th><th>위험도</th><th>출처</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className={`risk-row risk-${item.riskLevel}`} key={item.id}>
              <td>{item.workTypeName ?? "-"}</td>
              <td>{item.hazard}</td>
              <td><ReductionMeasureEditor text={item.reductionMeasure} /></td>
              <td><RiskMatrixBadge level={item.riskLevel} /></td>
              <td>{item.sourceType ?? "manual"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
