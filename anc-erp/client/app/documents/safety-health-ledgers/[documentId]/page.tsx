import Link from "next/link";

import { ErpShell } from "../../../../components/erp-shell";
import { LedgerMissingFieldPanel } from "../../../../components/ledger-missing-field-panel";
import { LedgerReviewWarningPanel } from "../../../../components/ledger-review-warning-panel";
import { LedgerSummaryCard } from "../../../../components/ledger-summary-card";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerDetailPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`안전보건대장 상세 · ${documentId}`} subtitle="프로젝트 누적 대장의 상태, 누락, 경고, 연결 원본을 검토합니다.">
      <section className="hero-card ledger-detail-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Project Ledger Context</p>
            <h2 className="hero-title">{pageData.detail.snapshot.meta.projectName}</h2>
            <p className="hero-subtitle">
              회차별 보고서가 아닌 프로젝트 장기 누적 원장입니다. 계획 데이터와 실행 데이터를 함께 검토합니다.
            </p>
          </div>
          <div className="status-stack">
            <span className="pill outline">Project Document</span>
            <span className="pill outline">{pageData.detail.snapshot.meta.sourcePlanId ? "안전관리계획서 연결됨" : "계획 연결 대기"}</span>
          </div>
        </div>
      </section>
      <div className="quick-link-row">
        <Link className="quick-link" href={`/documents/safety-health-ledgers/${documentId}/edit`}>편집</Link>
        <Link className="quick-link" href={`/documents/safety-health-ledgers/${documentId}/risks`}>위험요인</Link>
        <Link className="quick-link" href={`/documents/safety-health-ledgers/${documentId}/preview`}>미리보기</Link>
        <Link className="quick-link" href={`/documents/safety-health-ledgers/${documentId}/export`}>export</Link>
      </div>
      <LedgerSummaryCard detail={pageData.detail} />
      <div className="feature-split">
        <div className="section-stack">
          <LedgerReviewWarningPanel warnings={pageData.detail.warnings} />
        </div>
        <div className="feature-side-stack">
          <LedgerMissingFieldPanel items={pageData.detail.missingFields} />
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Linked Data Scope</p>
                <h3 className="panel-title">누적 범위</h3>
              </div>
            </div>
            <div className="ops-card-list">
              <article className="ops-item">
                <strong>점검이력</strong>
                <span>{pageData.detail.inspectionHistory.length}회차가 대장에 반영되었습니다.</span>
              </article>
              <article className="ops-item">
                <strong>지적/조치</strong>
                <span>{pageData.detail.findingHistory.length}건의 실행 데이터가 누적되었습니다.</span>
              </article>
              <article className="ops-item">
                <strong>산안비/첨부</strong>
                <span>{pageData.detail.safetyCostHistory.length}건 / {pageData.detail.attachments.length}건 연결</span>
              </article>
            </div>
          </section>
        </div>
      </div>
    </ErpShell>
  );
}
