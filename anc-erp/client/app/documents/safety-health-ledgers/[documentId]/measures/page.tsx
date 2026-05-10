import { ErpShell } from "../../../../../components/erp-shell";
import { RiskReductionMeasureTable } from "../../../../../components/risk-reduction-measure-table";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerMeasuresPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`감소대책 · ${documentId}`} subtitle="위험요인별 감소대책 이행 상태를 누적 관리합니다.">
      <RiskReductionMeasureTable items={pageData.detail.measures} />
    </ErpShell>
  );
}
