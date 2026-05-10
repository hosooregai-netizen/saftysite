"use client";

import { useState } from "react";

import type { FileVersion } from "../../packages/contracts/src";
import { addWebhardFileVersionDraft } from "../lib/webhard-actions";

export function FileVersionPanel({ fileId, versions }: { fileId: string; versions: FileVersion[] }) {
  const [currentVersions, setCurrentVersions] = useState(versions);
  const [versionKind, setVersionKind] = useState("working");
  const [changeSummary, setChangeSummary] = useState("");

  async function handleAddVersion() {
    const response = await addWebhardFileVersionDraft(fileId, {
      versionKind,
      changeSummary: changeSummary || undefined,
      sizeBytes: 1,
    });
    setCurrentVersions(response.versions);
    setChangeSummary("");
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FileVersionPanel</p>
          <h3 className="panel-title">버전 이력</h3>
        </div>
      </div>
      <div className="form-grid">
        <label className="form-field">
          <span>버전 종류</span>
          <select className="select-field" onChange={(event) => setVersionKind(event.target.value)} value={versionKind}>
            <option value="working">working</option>
            <option value="review">review</option>
            <option value="final">final</option>
            <option value="signed">signed</option>
            <option value="submitted">submitted</option>
          </select>
        </label>
        <label className="form-field">
          <span>변경 요약</span>
          <input
            className="fake-input"
            onChange={(event) => setChangeSummary(event.target.value)}
            placeholder="예: 검토본 추가"
            value={changeSummary}
          />
        </label>
      </div>
      <button className="secondary-button" onClick={handleAddVersion} type="button">
        버전 추가
      </button>
      <table className="data-table">
        <thead>
          <tr>
            <th>No</th>
            <th>종류</th>
            <th>파일명</th>
            <th>변경 요약</th>
          </tr>
        </thead>
        <tbody>
          {currentVersions.map((version) => (
            <tr key={version.id}>
              <td>{version.versionNo}</td>
              <td>{version.versionKind}</td>
              <td>{version.fileName}</td>
              <td>{version.changeSummary ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
