import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerVersionHistory } from "../../../../../components/ledger-version-history";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerVersionsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`대장 버전 · ${documentId}`} subtitle="개정/버전 이력을 검토합니다.">
      <LedgerVersionHistory items={pageData.detail.versions} />
    </ErpShell>
  );
}
