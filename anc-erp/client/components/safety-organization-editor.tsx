"use client";

import { useState } from "react";

import type { SafetyOrganizationPlan } from "../../packages/contracts/src";
import { updateSafetyManagementOrganizationDraft } from "../lib/safety-management-plan-actions";
import { ContactPicker } from "./contact-picker";
import { OrganizationRoleTable } from "./organization-role-table";

export function SafetyOrganizationEditor({ planId, organization }: { planId: string; organization?: SafetyOrganizationPlan | null }) {
  const [responsibilities, setResponsibilities] = useState(organization?.responsibilities ?? []);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [responsibility, setResponsibility] = useState("");

  async function handleSave() {
    await updateSafetyManagementOrganizationDraft(planId, {
      organizationChartFileId: organization?.organizationChartFileId ?? null,
      responsibilities,
    });
  }

  function handleAdd() {
    if (!role.trim() || !responsibility.trim()) {
      return;
    }
    setResponsibilities((current) => [
      ...current,
      {
        role: role.trim(),
        name: name.trim() || null,
        responsibility: responsibility.trim(),
      },
    ]);
    setRole("");
    setName("");
    setResponsibility("");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyOrganizationEditor</p>
          <h3 className="panel-title">안전관리조직</h3>
        </div>
        <button className="secondary-button" onClick={handleSave} type="button">저장</button>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>역할</span>
          <input className="fake-input" onChange={(event) => setRole(event.target.value)} value={role} />
        </label>
        <ContactPicker label="담당자" onChange={setName} value={name} />
        <label className="form-field span-2">
          <span>책임</span>
          <textarea className="fake-input" onChange={(event) => setResponsibility(event.target.value)} rows={3} value={responsibility} />
        </label>
      </div>
      <div className="inline-actions">
        <button className="secondary-button" onClick={handleAdd} type="button">역할 추가</button>
      </div>
      <OrganizationRoleTable rows={responsibilities} />
    </section>
  );
}
