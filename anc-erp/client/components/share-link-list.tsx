"use client";

import { useState } from "react";

import type { ShareLink } from "../../packages/contracts/src";
import { revokeWebhardShareLinkDraft } from "../lib/webhard-actions";
import { StatusBadge } from "./status-badge";

export function ShareLinkList({ items }: { items: ShareLink[] }) {
  const [links, setLinks] = useState(items);

  async function handleRevoke(shareLinkId: string) {
    const response = await revokeWebhardShareLinkDraft(shareLinkId);
    setLinks((current) => current.map((item) => (item.id === shareLinkId ? response.shareLink : item)));
  }

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ShareLinkList</p>
          <h3 className="panel-title">공유 링크</h3>
          <p className="inline-link-meta">권한, 만료, 폐기 여부를 확인하면서 외부 공유본을 통제합니다.</p>
        </div>
        <span className="pill outline">{links.length} links</span>
      </div>
      <ul className="webhard-share-list">
        {links.map((item) => (
          <li className="webhard-share-item" key={item.id}>
            <div>
              <strong>{item.title ?? item.tokenHash}</strong>
              <p className="inline-link-meta">
                {item.permission} · {item.fileId ?? item.folderId ?? "unlinked"} ·{" "}
                {item.expiresAt ? item.expiresAt.slice(0, 10) : "만료 미설정"}
              </p>
            </div>
            <div className="status-stack">
              <StatusBadge tone={item.isRevoked ? "danger" : "submitted"} label={item.isRevoked ? "revoked" : "active"} />
              {!item.isRevoked ? (
                <button className="secondary-button" onClick={() => handleRevoke(item.id)} type="button">
                  폐기
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
