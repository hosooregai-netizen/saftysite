import type { ContractDetailResponse, ContractPreviewResponse } from "../../packages/contracts/src";
import { DocumentPreview } from "./document-preview";
import { MissingFieldPanel } from "./missing-field-panel";
import { StatusBadge } from "./status-badge";

export function AIDraftPanel({ preview }: { preview: ContractPreviewResponse }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AIDraftPanel</p>
          <h3>AI 초안 메모</h3>
        </div>
      </div>
      <div className="section-stack">
        <div className="badge-row">
          <StatusBadge tone="review" label="AI 초안" />
          <StatusBadge tone="warning" label="법률문구 자동생성 금지" />
        </div>
        <p>{preview.draftText.split("\n").slice(0, 4).join(" / ")}</p>
      </div>
    </section>
  );
}

export function ContractPreviewA4({
  detail,
  preview,
}: {
  detail: ContractDetailResponse;
  preview: ContractPreviewResponse;
}) {
  return (
    <div className="contract-preview-layout">
      <div className="contract-preview-side">
        <MissingFieldPanel
          title="변수 / 누락정보"
          items={preview.missingFields.length > 0
            ? preview.missingFields.map((field) => ({
                label: field,
                reason: "계약서 초안에는 표시되지만 확정 전 보완이 필요합니다.",
                severity: "required" as const,
              }))
            : [
                {
                  label: "기본 구조 확인",
                  reason: "현재 초안은 필수 누락 없이 생성되었고, 발주처 split과 지급조건 위주 검토가 남았습니다.",
                  severity: "recommended" as const,
                },
              ]}
        />
        <section className="card">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Variable Panel</p>
              <h3>초안 반영 변수</h3>
            </div>
          </div>
          <div className="status-stack">
            <span>프로젝트: {detail.project.projectName}</span>
            <span>용역범위: {detail.contract.serviceScope || "미입력"}</span>
            <span>점검횟수: {detail.contract.inspectionCount ?? "미입력"}</span>
          </div>
        </section>
      </div>
      <div className="contract-preview-center">
        <DocumentPreview
          title="계약서 A4 미리보기"
          statusLabel="AI 초안 / 검토 전"
          statusTone="review"
          previewTitle={detail.contract.contractTitle}
          rows={[
            { label: "프로젝트", status: detail.project.projectName, note: "projectId 기준" },
            { label: "용역범위", status: detail.contract.serviceScope, note: "template 기반" },
            { label: "점검횟수", status: String(detail.contract.inspectionCount ?? "-"), note: "Inspection 연동 예정" },
          ]}
          noteBadges={["AI 초안", "법률문구 자동생성 금지", `버전 ${detail.versions.length}개`]}
        />
        <section className="card contract-preview-actions">
          <div className="badge-row">
            <StatusBadge tone="review" label="AI 초안 생성" />
            <StatusBadge tone="info" label="저장" />
            <StatusBadge tone="warning" label="검토 요청" />
            <StatusBadge tone="submitted" label="PDF/HWPX 내보내기" />
            <StatusBadge tone="success" label="날인본 업로드" />
          </div>
        </section>
      </div>
      <div className="contract-preview-side">
        <AIDraftPanel preview={preview} />
        <section className="card">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Review Warnings</p>
              <h3>검토 경고</h3>
            </div>
          </div>
          <div className="missing-list">
            <div className="missing-item">
              <strong>최종본 / 날인본 구분</strong>
              <span>finalFileId와 signedFileId는 서로 다른 문서 상태로 유지됩니다.</span>
            </div>
            <div className="missing-item">
              <strong>발주처별 제출 영향</strong>
              <span>분담비율과 지급조건 변경은 이후 보고서 및 제출 흐름에 영향을 줍니다.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
