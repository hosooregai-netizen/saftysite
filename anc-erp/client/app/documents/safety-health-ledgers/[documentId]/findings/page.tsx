import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerActionHistoryTimeline } from "../../../../../components/ledger-action-history-timeline";
import { LedgerFindingHistoryTable } from "../../../../../components/ledger-finding-history-table";
import { LedgerSyncPreviewModal } from "../../../../../components/ledger-sync-preview-modal";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerFindingsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`지적/조치이력 · ${documentId}`} subtitle="Finding과 CorrectiveAction 누적 이력을 프로젝트 ledger 관점으로 검토합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <LedgerFindingHistoryTable items={pageData.detail.findingHistory} />
          <LedgerActionHistoryTimeline items={pageData.detail.findingHistory} />
        </div>
        <div className="feature-side-stack">
          <LedgerSyncPreviewModal ledgerId={pageData.detail.ledger.id} target="finding" />
        </div>
      </div>
    </ErpShell>
  );
}
