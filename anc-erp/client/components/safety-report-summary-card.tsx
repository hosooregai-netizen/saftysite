import type { SafetyReportDetailResponse } from "../../packages/contracts/src";
import { ReportStatusBadge } from "./report-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyReportSummaryCardProps = {
  detail: SafetyReportDetailResponse;
};

export function SafetyReportSummaryCard({
  detail,
}: SafetyReportSummaryCardProps) {
  const warningCount = detail.warnings.length;
  const missingRequiredCount = detail.missingFields.filter(
    (item) => item.severity === "required",
  ).length;

  return (
    <section className="hero-card report-summary-hero">
      <div className="hero-head">
        <div>
          <p className="card-eyebrow">DocumentInstance</p>
          <h2 className="hero-title">{detail.document.title}</h2>
          <p className="hero-subtitle">
            Project, InspectionRound, OwnerParty 기준 snapshot과 최신 저장 version을 함께 검토하고,
            발주처별 문서 branch 상태를 이 화면에서 결정합니다.
          </p>
        </div>
        <div className="hero-badges">
          <ReportStatusBadge status={detail.document.status} />
          <StatusBadge tone="info" label={detail.snapshot.meta.ownerDisplayName} />
          <StatusBadge tone="review" label={`v${detail.document.latestVersionNo}`} />
          <StatusBadge
            tone={missingRequiredCount > 0 ? "warning" : "success"}
            label={`필수 누락 ${missingRequiredCount}건`}
          />
        </div>
      </div>
      <div className="report-meta-strip">
        <span>문서번호 {detail.document.documentNo ?? "미부여"}</span>
        <span>회차 {detail.document.roundNo}회</span>
        <span>발주처 {detail.snapshot.meta.ownerDisplayName}</span>
        <span>경고 {warningCount}건</span>
      </div>
      <div className="hero-summary-grid">
        <article className="hero-summary-card">
          <span>문서번호</span>
          <strong>{detail.document.documentNo ?? "미입력"}</strong>
        </article>
        <article className="hero-summary-card">
          <span>점검회차</span>
          <strong>{detail.document.roundNo}회</strong>
        </article>
        <article className="hero-summary-card">
          <span>원본 연결</span>
          <strong>
            체크리스트 {detail.linkedDataSummary.checklistResults} / 지적 {detail.linkedDataSummary.findings}
          </strong>
        </article>
        <article className="hero-summary-card">
          <span>사진대지/산안비</span>
          <strong>
            {detail.linkedDataSummary.photoLedgers} / {detail.linkedDataSummary.safetyCostUsages}
          </strong>
        </article>
        <article className="hero-summary-card">
          <span>첨부/제출 연결</span>
          <strong>
            {detail.linkedDataSummary.attachments} / {detail.document.submissionId ?? "미제출"}
          </strong>
        </article>
      </div>
    </section>
  );
}
