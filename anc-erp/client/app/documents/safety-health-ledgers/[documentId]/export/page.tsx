import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerMissingFieldPanel } from "../../../../../components/ledger-missing-field-panel";
import { LedgerReviewWarningPanel } from "../../../../../components/ledger-review-warning-panel";
import { LedgerExportChecklist } from "../../../../../components/ledger-export-checklist";
import { LedgerVersionHistory } from "../../../../../components/ledger-version-history";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerExportPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`안전보건대장 export · ${documentId}`} subtitle="최신 저장 snapshot 기준으로 export 전 검토를 수행합니다.">
      <section className="hero-card ledger-export-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Export Review</p>
            <h2 className="hero-title">최종본 export 전 검토</h2>
            <p className="hero-subtitle">필수 누락, 반복 위험, 미조치 지적사항, 웹하드 저장 위치를 마지막으로 확인합니다.</p>
          </div>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <LedgerExportChecklist
            exportPath={pageData.detail.exportedFile?.storagePath}
            ledgerId={pageData.detail.ledger.id}
            missingFields={pageData.validation.missingFields}
            warnings={pageData.validation.warnings}
          />
        </div>
        <div className="feature-side-stack">
          <LedgerMissingFieldPanel items={pageData.validation.missingFields} />
          <LedgerReviewWarningPanel warnings={pageData.validation.warnings} />
          <LedgerVersionHistory items={pageData.detail.versions} />
        </div>
      </div>
    </ErpShell>
  );
}
