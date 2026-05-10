"use client";

import { useState } from "react";

import type { Finding } from "../../packages/contracts/src";
import {
  createRoundFindingDraft,
  updateFindingDraft,
} from "../lib/finding-actions";
import { FindingRiskBadge } from "./finding-risk-badge";
import { StatusBadge } from "./status-badge";

type FindingFormProps = {
  finding?: Finding;
  inspectionRoundId?: string;
  title: string;
};

export function FindingForm({ finding, inspectionRoundId, title }: FindingFormProps) {
  const [message, setMessage] = useState("draft 검토");

  async function handleSubmitDraft() {
    setMessage("저장 중");
    try {
      if (finding) {
        await updateFindingDraft(finding.id, {
          title: finding.title,
          detail: finding.detail,
          dueDate: finding.dueDate,
          reportInclude: finding.reportInclude,
        });
        setMessage("PATCH /findings/{id}");
        return;
      }
      if (!inspectionRoundId) {
        setMessage("inspectionRoundId 필요");
        return;
      }
      await createRoundFindingDraft(inspectionRoundId, {
        title: "현장 수동 지적사항 초안",
        detail: "InspectionRound 하위 수동 입력 지적사항 초안",
      });
      setMessage("POST /inspection-rounds/{id}/findings");
    } catch {
      setMessage("API 응답 대기");
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Finding Form</p>
          <h3>{title}</h3>
          <p>실제 저장은 API로 연결되며, 현재 화면은 draft 검토용 필드 배치를 제공합니다.</p>
        </div>
        <StatusBadge tone="review" label={message} />
      </div>
      <div className="detail-grid">
        <div>
          <strong>제목</strong>
          <p>{finding?.title ?? "신규 지적사항 제목 입력"}</p>
        </div>
        <div>
          <strong>위험유형</strong>
          <div className="badge-row">
            <FindingRiskBadge riskType={finding?.riskType} />
          </div>
        </div>
        <div>
          <strong>조치요청</strong>
          <p>{finding?.requiredAction ?? "시공사 조치요청 내용을 입력합니다."}</p>
        </div>
        <div>
          <strong>기한</strong>
          <p>{finding?.dueDate ?? "미정"}</p>
        </div>
      </div>
      <article className="card muted-card">
        <strong>상세 내용</strong>
        <p>{finding?.detail ?? "체크리스트 / 추가위험 / 메일 회신에서 들어온 원본 문장을 검토합니다."}</p>
      </article>
      <div className="link-list">
        <button className="inline-link button-reset" onClick={handleSubmitDraft} type="button">
          지적사항 API 호출
        </button>
      </div>
    </section>
  );
}
