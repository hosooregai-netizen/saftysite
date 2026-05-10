"use client";

import { useState } from "react";

import type { SafetyEducationPlan } from "../../packages/contracts/src";
import { updateSafetyManagementEducationDraft } from "../lib/safety-management-plan-actions";
import { EducationPlanForm } from "./education-plan-form";

export function EducationPlanTable({ planId, education }: { planId: string; education?: SafetyEducationPlan | null }) {
  const [items, setItems] = useState(education?.items ?? []);

  async function handleSave() {
    await updateSafetyManagementEducationDraft(planId, { items });
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">EducationPlanTable</p>
          <h3 className="panel-title">안전교육 계획</h3>
        </div>
        <button className="secondary-button" onClick={handleSave} type="button">저장</button>
      </div>
      <EducationPlanForm onAdd={(item) => setItems((current) => [...current, item])} />
      <table className="data-table">
        <thead>
          <tr><th>교육유형</th><th>대상</th><th>주기</th><th>기록</th></tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.educationType}-${index}`}>
              <td>{item.educationType}</td>
              <td>{item.target}</td>
              <td>{item.cycle}</td>
              <td>{item.recordMethod}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
