"use client";

import { useState } from "react";

import type { SafetyEmergencyPlan } from "../../packages/contracts/src";
import { updateSafetyManagementEmergencyDraft } from "../lib/safety-management-plan-actions";
import { ContactPicker } from "./contact-picker";
import { EmergencyProcedureEditor } from "./emergency-procedure-editor";

export function EmergencyContactTable({ planId, emergency }: { planId: string; emergency?: SafetyEmergencyPlan | null }) {
  const [contacts, setContacts] = useState(emergency?.contacts ?? []);
  const [type, setType] = useState("");
  const [organization, setOrganization] = useState("");
  const [note, setNote] = useState("");

  async function handleSave() {
    await updateSafetyManagementEmergencyDraft(planId, { contacts });
  }

  function handleAdd() {
    if (!type.trim()) {
      return;
    }
    setContacts((current) => [
      ...current,
      {
        type: type.trim(),
        organization: organization.trim() || null,
        note: note.trim() || null,
      },
    ]);
    setType("");
    setOrganization("");
    setNote("");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">EmergencyContactTable</p>
          <h3 className="panel-title">비상연락망</h3>
        </div>
        <button className="secondary-button" onClick={handleSave} type="button">저장</button>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>연락 구분</span>
          <input className="fake-input" onChange={(event) => setType(event.target.value)} value={type} />
        </label>
        <ContactPicker label="소속" onChange={setOrganization} value={organization} />
        <EmergencyProcedureEditor onChange={setNote} value={note} />
      </div>
      <div className="inline-actions">
        <button className="secondary-button" onClick={handleAdd} type="button">연락망 추가</button>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>구분</th><th>소속</th><th>비고</th></tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr key={`${contact.type}-${index}`}>
              <td>{contact.type}</td>
              <td>{contact.organization ?? "-"}</td>
              <td>{contact.note ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
