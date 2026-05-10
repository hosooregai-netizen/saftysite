import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyHealthLedgerEditWorkspace } from "../../../../../components/safety-health-ledger-edit-workspace";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerEditPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`안전보건대장 편집 · ${documentId}`} subtitle="섹션별 누적 대장 내용을 보정하고 최신 snapshot으로 저장합니다.">
      <SafetyHealthLedgerEditWorkspace
        detail={{
          sections: pageData.detail.sections,
          sourceLinks: pageData.detail.snapshot.sourceLinks,
          previewDetail: pageData.detail,
          missingFields: pageData.detail.missingFields,
          warnings: pageData.detail.warnings,
          meta: {
            projectName: pageData.detail.snapshot.meta.projectName,
            sourcePlanId: pageData.detail.snapshot.meta.sourcePlanId,
          },
        }}
        ledgerId={pageData.detail.ledger.id}
      />
    </ErpShell>
  );
}
