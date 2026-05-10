"use client";

import { useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { ContactWithOrganization, InspectionRound, ProjectPartyWithOrganization } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function InspectionRoundForm({
  round,
  contacts,
  projectParties,
  projectId,
  inspectionRoundId,
}: {
  round: Partial<InspectionRound>;
  contacts: ContactWithOrganization[];
  projectParties: ProjectPartyWithOrganization[];
  projectId?: string;
  inspectionRoundId?: string;
}) {
  const [actionState, setActionState] = useState("Draft Only");

  async function handleSubmitDraft() {
    if (!projectId) {
      return;
    }
    const api = createBrowserApiClient();
    const payload = {
      roundNo: round.roundNo ?? 1,
      name: round.name ?? `${round.roundNo ?? 1}회 점검`,
      status: round.status ?? "planned",
      plannedMonth: round.plannedMonth ?? null,
      plannedDate: round.plannedDate ?? null,
      actualInspectionDate: round.actualInspectionDate ?? null,
      documentNo: round.documentNo ?? null,
      inspectorUserId: round.inspectorUserId ?? null,
      confirmerContactId: round.confirmerContactId ?? null,
      contractorContactId: round.contractorContactId ?? null,
      reportDueDate: round.reportDueDate ?? null,
      milestoneLabel: round.milestoneLabel ?? null,
      memo: round.memo ?? null,
      scheduleId: round.scheduleId ?? null,
    };
    setActionState("전송 중");
    try {
      if (inspectionRoundId) {
        await api.updateInspectionRound(inspectionRoundId, payload);
        setActionState("수정 API 연결됨");
      } else {
        await api.createInspectionRound(projectId, payload);
        setActionState("생성 API 연결됨");
      }
    } catch {
      setActionState("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionRoundForm</p>
          <h3>{round.id ? "점검회차 수정" : "점검회차 등록"}</h3>
        </div>
        <StatusBadge tone="review" label={actionState} />
      </div>
      <table className="table">
        <tbody>
          <tr>
            <th>회차</th>
            <td>{round.roundNo ?? "-"}</td>
          </tr>
          <tr>
            <th>예정월</th>
            <td>{round.plannedMonth ?? "미정"}</td>
          </tr>
          <tr>
            <th>예정일</th>
            <td>{round.plannedDate ?? "미정"}</td>
          </tr>
          <tr>
            <th>담당자 후보</th>
            <td>{contacts.map((item) => item.name).join(", ") || "-"}</td>
          </tr>
          <tr>
            <th>발주처 분기</th>
            <td>{projectParties.filter((item) => item.role === "owner").map((item) => item.organization?.name ?? item.organizationId).join(", ")}</td>
          </tr>
        </tbody>
      </table>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleSubmitDraft} type="button">
          {inspectionRoundId ? "회차 수정 API 호출" : "회차 생성 API 호출"}
        </button>
      </div>
    </section>
  );
}
