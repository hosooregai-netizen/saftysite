"use client";

import { useState, useTransition } from "react";

import type { SignatureAsset } from "../../packages/contracts/src";
import { updateAdminSignatureAssetAction } from "../lib/admin-actions";
import { StatusBadge } from "./status-badge";

type SealAssetPickerProps = {
  items: SignatureAsset[];
  mode?: "document" | "admin";
};

export function SealAssetPicker({ items, mode = "document" }: SealAssetPickerProps) {
  const [message, setMessage] = useState("선택 후보");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SealAssetPicker</p>
          <h3 className="panel-title">직인 자산 선택 후보</h3>
        </div>
        {mode === "admin" ? <StatusBadge tone={isPending ? "warning" : "review"} label={message} /> : null}
      </div>
      <div className="hero-badges">
        {items.filter((asset) => asset.assetType === "seal").map((asset) => (
          <button
            className="pill outline button-reset"
            key={asset.id}
            onClick={() =>
              mode === "admin"
                ? startTransition(async () => {
                    try {
                      await updateAdminSignatureAssetAction(asset.id, { status: "active" });
                      setMessage(`PATCH /admin/signature-assets/${asset.id}`);
                    } catch {
                      setMessage("자산 저장 대기");
                    }
                  })
                : undefined
            }
            type="button"
          >
            {asset.label}
          </button>
        ))}
      </div>
    </section>
  );
}
