"use client";

import { useState } from "react";

import type { FileAsset } from "../../packages/contracts/src";
import { restoreWebhardFileDraft } from "../lib/webhard-actions";
import { StatusBadge } from "./status-badge";

export function TrashTable({ items }: { items: FileAsset[] }) {
  const [trashItems, setTrashItems] = useState(items);

  async function handleRestore(fileId: string) {
    await restoreWebhardFileDraft(fileId);
    setTrashItems((current) => current.filter((item) => item.id !== fileId));
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TrashTable</p>
          <h3 className="panel-title">휴지통</h3>
          <p className="inline-link-meta">영구 삭제 전에 복구 가능 상태를 검토하는 보관함입니다.</p>
        </div>
        <span className="pill outline">{trashItems.length} files</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>파일명</th>
            <th>상태</th>
            <th>경로</th>
            <th>복구</th>
          </tr>
        </thead>
        <tbody>
          {trashItems.map((item) => (
            <tr key={item.id}>
              <td>{item.fileName}</td>
              <td>
                <StatusBadge tone="danger" label={item.status ?? "deleted"} />
              </td>
              <td>{item.storagePath}</td>
              <td>
                <button className="secondary-button" onClick={() => handleRestore(item.id)} type="button">
                  복구
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
