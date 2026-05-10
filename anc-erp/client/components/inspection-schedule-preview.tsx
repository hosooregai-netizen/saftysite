"use client";

import { useMemo, useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { InspectionSchedulePreviewResponse } from "../../packages/contracts/src";
import { MilestoneBadge } from "./milestone-badge";
import { StatusBadge } from "./status-badge";

type InspectionScheduleDraftPayload = {
  contractId?: string | null;
  scheduleName: string;
  basisType: string;
  cycleText: string;
  totalRounds: number;
};

export function InspectionSchedulePreview({
  projectId,
  preview,
  generatePayload,
}: {
  projectId: string;
  preview: InspectionSchedulePreviewResponse;
  generatePayload: InspectionScheduleDraftPayload;
}) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionState, setActionState] = useState("저장 전 preview");

  async function handleGenerate() {
    setActionState("생성 요청 중");
    try {
      await api.generateInspectionSchedule(projectId, {
        ...generatePayload,
        rounds: preview.rounds.map((round) => ({
          roundNo: round.roundNo,
          plannedMonth: round.plannedMonth ?? null,
          plannedDate: round.plannedDate ?? null,
          actualInspectionDate: round.actualInspectionDate ?? null,
          documentNo: round.documentNo,
          milestoneLabel: round.milestoneLabel ?? null,
        })),
      });
      setActionState("생성 API 연결됨");
    } catch {
      setActionState("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionSchedulePreview</p>
          <h3>일정 미리보기</h3>
          <p>생성 전 회차별 예정월, 문서번호, milestone을 한 번에 검토합니다.</p>
        </div>
        <StatusBadge tone="review" label={actionState} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>회차</th>
            <th>예정월</th>
            <th>예정일</th>
            <th>문서번호</th>
            <th>milestone</th>
          </tr>
        </thead>
        <tbody>
          {preview.rounds.map((round) => (
            <tr key={round.roundNo}>
              <td>{round.roundNo}회</td>
              <td>{round.plannedMonth ?? "-"}</td>
              <td>{round.plannedDate ?? "-"}</td>
              <td>{round.documentNo}</td>
              <td><MilestoneBadge label={round.milestoneLabel} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="badge-row" style={{ marginTop: 14 }}>
        <span className="pill">발주처 보고서 {preview.ownerReportTasks.length}건 자동 생성 예정</span>
        <span className="pill outline">문서번호 사전 검토</span>
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handleGenerate} type="button">
          일정 generate API 호출
        </button>
      </div>
    </section>
  );
}
