"use client";

import { useState } from "react";

import type { SafetyManagementWorkType } from "../../packages/contracts/src";
import { createSafetyManagementWorkTypeDraft } from "../lib/safety-management-plan-actions";

export function WorkTypeTable({ planId, items }: { planId: string; items: SafetyManagementWorkType[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }
    await createSafetyManagementWorkTypeDraft(planId, {
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setName("");
    setDescription("");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">WorkTypeTable</p>
          <h3 className="panel-title">작업공종</h3>
        </div>
        <button className="secondary-button" onClick={handleCreate} type="button">
          공종 추가
        </button>
      </div>
      <div className="report-export-summary">
        <div className="kv-card">
          <strong>등록 공종</strong>
          <span>{items.length}건</span>
        </div>
        <div className="kv-card">
          <strong>입력 목적</strong>
          <span>위험요인 후보 생성 기준</span>
        </div>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>공종명</span>
          <input className="fake-input" onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <label className="form-field">
          <span>작업공법 메모</span>
          <input className="fake-input" onChange={(event) => setDescription(event.target.value)} value={description} />
        </label>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>공종</th><th>설명</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.description ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
