import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerInspectionHistoryTable } from "../../../../../components/ledger-inspection-history-table";
import { LedgerSyncPreviewModal } from "../../../../../components/ledger-sync-preview-modal";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerInspectionsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`점검이력 · ${documentId}`} subtitle="InspectionRound 단위 점검회차 결과를 프로젝트 ledger에 누적합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <LedgerInspectionHistoryTable items={pageData.detail.inspectionHistory} />
        </div>
        <div className="feature-side-stack">
          <LedgerSyncPreviewModal ledgerId={pageData.detail.ledger.id} target="inspection" />
        </div>
      </div>
    </ErpShell>
  );
}
