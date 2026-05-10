"use client";

import { useState } from "react";

import type { ActionRequestMailDraft } from "../../packages/contracts/src";
import {
  draftActionRequestMailForFindings,
  sendActionRequestMailDraft,
} from "../lib/finding-actions";
import { StatusBadge } from "./status-badge";

type ActionRequestMailButtonProps = {
  draft?: ActionRequestMailDraft | null;
  projectId: string;
  inspectionRoundId: string;
  findingIds: string[];
  ownerPartyId?: string | null;
  contractorContactId?: string | null;
};

export function ActionRequestMailButton({
  draft,
  projectId,
  inspectionRoundId,
  findingIds,
  ownerPartyId,
  contractorContactId,
}: ActionRequestMailButtonProps) {
  const [message, setMessage] = useState(draft ? "초안 준비" : "미작성");
  const [localDraft, setLocalDraft] = useState<ActionRequestMailDraft | null>(draft ?? null);

  async function handleDraft() {
    setMessage("초안 생성 중");
    try {
      const response = await draftActionRequestMailForFindings({
        projectId,
        inspectionRoundId,
        findingIds,
        ownerPartyId,
        contractorContactId,
      });
      setLocalDraft(response.mailDraft);
      setMessage("POST /findings/action-request-mail/draft");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  async function handleSend() {
    if (!localDraft) {
      setMessage("메일 초안 필요");
      return;
    }
    setMessage("메일 발송 중");
    try {
      await sendActionRequestMailDraft({ mailDraftId: localDraft.id });
      setMessage("POST /findings/action-request-mail/send");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Action Request Mail</p>
          <h3>시공사 조치요청 메일 초안</h3>
        </div>
        <StatusBadge tone={localDraft ? "review" : "info"} label={message} />
      </div>
      <p>{localDraft?.subject ?? "선택한 지적사항으로 메일 초안을 생성합니다."}</p>
      <p className="table-subtext">{localDraft?.body ?? "발송 전 제목, 본문, 첨부 사진을 검토합니다."}</p>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleDraft} type="button">
          메일 초안 API 호출
        </button>
        <button className="inline-link button-reset" onClick={handleSend} type="button">
          메일 발송 API 호출
        </button>
      </div>
    </section>
  );
}
