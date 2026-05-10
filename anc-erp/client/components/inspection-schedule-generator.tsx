"use client";

import { useMemo, useState } from "react";

import { createBrowserApiClient } from "../lib/api";
import type { InspectionSchedule, InspectionSchedulePreviewResponse } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type InspectionScheduleDraftPayload = {
  contractId?: string | null;
  scheduleName: string;
  basisType: string;
  cycleText: string;
  totalRounds: number;
};

export function InspectionScheduleGenerator({
  projectId,
  schedule,
  preview,
  previewPayload,
}: {
  projectId: string;
  schedule?: InspectionSchedule | null;
  preview: InspectionSchedulePreviewResponse;
  previewPayload: InspectionScheduleDraftPayload;
}) {
  const api = useMemo(() => createBrowserApiClient(), []);
  const [actionState, setActionState] = useState("Preview Ready");

  async function handlePreviewRefresh() {
    setActionState("Preview 요청 중");
    try {
      await api.previewInspectionSchedule(projectId, previewPayload);
      setActionState("Preview API 연결됨");
    } catch {
      setActionState("API 응답 대기 / 로컬 검토용");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionScheduleGenerator</p>
          <h3>점검 일정 생성 기준</h3>
          <p>preview endpoint와 generate endpoint를 분리해 저장 전 검토 흐름을 먼저 보여줍니다.</p>
        </div>
        <StatusBadge tone="review" label={preview.isDraft ? actionState : "생성 완료"} />
      </div>
      <div className="inspection-generator-grid">
        <div className="kv-card">
          <strong>기존 일정</strong>
          <span>{schedule?.scheduleName ?? "없음"}</span>
        </div>
        <div className="kv-card">
          <strong>기준</strong>
          <span>{preview.scheduleDraft.basisType}</span>
        </div>
        <div className="kv-card">
          <strong>점검주기</strong>
          <span>{preview.scheduleDraft.cycleText}</span>
        </div>
        <div className="kv-card">
          <strong>총 회차</strong>
          <span>{preview.scheduleDraft.totalRounds}회</span>
        </div>
      </div>
      <div className="badge-row" style={{ marginTop: 14 }}>
        <span className="pill">발주처별 보고서 자동 분기</span>
        <span className="pill outline">문서번호 규칙 유지</span>
        <span className="pill outline">미리보기 후 저장</span>
      </div>
      <div className="link-list" style={{ marginTop: 16 }}>
        <button className="inline-link button-reset" onClick={handlePreviewRefresh} type="button">
          일정 preview API 호출
        </button>
      </div>
    </section>
  );
}
