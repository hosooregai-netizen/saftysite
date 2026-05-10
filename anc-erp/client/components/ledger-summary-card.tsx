import type { SafetyHealthLedgerDetailResponse } from "../../packages/contracts/src";
import { LedgerStatusBadge } from "./ledger-status-badge";

export function LedgerSummaryCard({ detail }: { detail: SafetyHealthLedgerDetailResponse }) {
  const repeatedRisks = detail.riskItems.filter((item) => item.recurrenceCount > 1 || item.status === "repeated").length;
  const openFindings = detail.findingHistory.filter((item) => !["verified", "closed"].includes(item.status)).length;

  return (
    <section className="panel report-summary-card ledger-summary-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerSummaryCard</p>
          <h3 className="panel-title">{detail.ledger.title}</h3>
          <p className="card-copy">
            회차별 결과보고서가 아니라 프로젝트 전체 기간의 위험요인, 점검, 지적/조치, 산안비를 장기 누적하는 원장입니다.
          </p>
        </div>
        <div className="status-stack">
          <LedgerStatusBadge label={detail.ledger.status} />
          <span className="pill outline">AI DRAFT 분리</span>
          <span className="pill outline">Project Root</span>
        </div>
      </div>
      <div className="ledger-summary-meta">
        <article className="ledger-meta-card">
          <span>프로젝트</span>
          <strong>{detail.snapshot.meta.projectName}</strong>
          <p>{detail.snapshot.meta.siteName} · {detail.snapshot.meta.constructionType}</p>
        </article>
        <article className="ledger-meta-card">
          <span>계획 데이터</span>
          <strong>{detail.snapshot.meta.sourcePlanId ? "안전관리계획서 연결" : "연결 대기"}</strong>
          <p>{detail.snapshot.meta.sourcePlanId ?? "source plan 미연결"}</p>
        </article>
        <article className="ledger-meta-card">
          <span>실행 데이터</span>
          <strong>{detail.inspectionHistory.length}회차 / {detail.findingHistory.length}건</strong>
          <p>점검·지적·조치 누적 상태를 반영합니다.</p>
        </article>
      </div>
      <div className="summary-grid">
        <div className="summary-item">
          <span>위험요인</span>
          <strong>{detail.riskItems.length}건</strong>
          <em>반복 {repeatedRisks}건</em>
        </div>
        <div className="summary-item">
          <span>점검이력</span>
          <strong>{detail.inspectionHistory.length}회</strong>
          <em>최근 {detail.snapshot.meta.latestInspectionRoundNo ?? "-" }회차</em>
        </div>
        <div className="summary-item">
          <span>지적/조치</span>
          <strong>{detail.findingHistory.length}건</strong>
          <em>미조치 {openFindings}건</em>
        </div>
        <div className="summary-item">
          <span>산안비 이력</span>
          <strong>{detail.safetyCostHistory.length}건</strong>
          <em>첨부 {detail.attachments.length}건</em>
        </div>
      </div>
    </section>
  );
}
