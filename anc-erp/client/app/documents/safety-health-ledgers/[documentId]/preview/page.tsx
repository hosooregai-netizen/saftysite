import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerA4Preview } from "../../../../../components/ledger-a4-preview";
import { LedgerReviewWarningPanel } from "../../../../../components/ledger-review-warning-panel";
import { PageNavigator } from "../../../../../components/page-navigator";
import { PrintLayoutWarningPanel } from "../../../../../components/print-layout-warning-panel";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerPreviewPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`안전보건대장 미리보기 · ${documentId}`} subtitle="A4 문서 preview와 검토 경고를 함께 확인합니다.">
      <section className="hero-card report-preview-hero ledger-preview-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">A4 Preview Workspace</p>
            <h2 className="hero-title">대장 문서 미리보기</h2>
            <p className="hero-subtitle">실제 제출 전 누락정보, 경고, 페이지 구성, 장기 누적 문맥을 함께 검토합니다.</p>
          </div>
          <div className="status-stack">
            <span className="pill outline">A4 Preview</span>
            <span className="pill outline">Latest Snapshot</span>
          </div>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <LedgerA4Preview detail={pageData.detail} />
          <LedgerReviewWarningPanel warnings={pageData.detail.warnings} />
        </div>
        <div className="feature-side-stack">
          <PageNavigator
            items={[
              { href: `/documents/safety-health-ledgers/${documentId}`, label: "상세" },
              { href: `/documents/safety-health-ledgers/${documentId}/edit`, label: "편집" },
              { href: `/documents/safety-health-ledgers/${documentId}/preview`, label: "미리보기", active: true },
              { href: `/documents/safety-health-ledgers/${documentId}/export`, label: "export" },
            ]}
          />
          <PrintLayoutWarningPanel warnings={pageData.detail.warnings} />
        </div>
      </div>
    </ErpShell>
  );
}
