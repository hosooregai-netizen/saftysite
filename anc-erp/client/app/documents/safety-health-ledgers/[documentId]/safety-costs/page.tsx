import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerSafetyCostHistoryTable } from "../../../../../components/ledger-safety-cost-history-table";
import { LedgerSyncPreviewModal } from "../../../../../components/ledger-sync-preview-modal";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerSafetyCostsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`산안비 이력 · ${documentId}`} subtitle="회차별 산업안전보건관리비 확인 이력을 프로젝트 ledger에 누적합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <LedgerSafetyCostHistoryTable items={pageData.detail.safetyCostHistory} />
        </div>
        <div className="feature-side-stack">
          <LedgerSyncPreviewModal ledgerId={pageData.detail.ledger.id} target="safety_cost" />
        </div>
      </div>
    </ErpShell>
  );
}
