"use client";

import { useState } from "react";

import { syncMailAccountDraft } from "../lib/mail-actions";
import { StatusBadge } from "./status-badge";

function toneForStatus(status: string) {
  return status === "completed"
    ? "success"
    : status === "running"
      ? "info"
      : status === "failed"
        ? "danger"
        : "review";
}

export function MailSyncStatusBadge({ status, accountId }: { status: string; accountId?: string }) {
  const [currentStatus, setCurrentStatus] = useState(status);

  async function handleSync() {
    if (!accountId) {
      return;
    }
    setCurrentStatus("running");
    const response = await syncMailAccountDraft(accountId);
    setCurrentStatus(response.job?.status ?? "completed");
  }

  if (!accountId) {
    return <StatusBadge tone={toneForStatus(currentStatus)} label={currentStatus} />;
  }

  return (
    <button className="ghost-button" onClick={handleSync} type="button">
      <StatusBadge tone={toneForStatus(currentStatus)} label={currentStatus} />
    </button>
  );
}
