import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerRiskItemForm } from "../../../../../components/ledger-risk-item-form";
import { LedgerRiskRegisterTable } from "../../../../../components/ledger-risk-register-table";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerRisksPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  const repeatedCount = pageData.detail.riskItems.filter((item) => item.recurrenceCount > 1 || item.status === "repeated").length;
  const highRiskCount = pageData.detail.riskItems.filter((item) => ["high", "critical"].includes(item.riskLevel ?? "")).length;
  return (
    <ErpShell title={`위험요인 register · ${documentId}`} subtitle="Project 누적 위험요인과 반복 여부를 검토합니다.">
      <section className="hero-card ledger-register-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Ledger Risk Register</p>
            <h2 className="hero-title">프로젝트 장기 위험요인 원장</h2>
            <p className="hero-subtitle">안전관리계획서 기반 계획 데이터와 현장 실행 데이터에서 온 반복 위험을 함께 비교합니다.</p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card"><span>전체 위험요인</span><strong>{pageData.detail.riskItems.length}건</strong></article>
          <article className="hero-summary-card"><span>반복 위험</span><strong>{repeatedCount}건</strong></article>
          <article className="hero-summary-card"><span>고위험</span><strong>{highRiskCount}건</strong></article>
          <article className="hero-summary-card"><span>감소대책</span><strong>{pageData.detail.measures.length}건</strong></article>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <LedgerRiskRegisterTable items={pageData.detail.riskItems} />
        </div>
        <div className="feature-side-stack">
          <LedgerRiskItemForm ledgerId={pageData.detail.ledger.id} />
        </div>
      </div>
    </ErpShell>
  );
}
