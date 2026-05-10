import { ErpShell } from "../../../../components/erp-shell";
import { SafetyCostEvidenceTable } from "../../../../components/safety-cost-evidence-table";
import { SafetyCostEvidenceUploader } from "../../../../components/safety-cost-evidence-uploader";
import { loadSafetyCostDetailPageData } from "../../../../lib/safety-cost-page-data";

type SafetyCostEvidencePageProps = {
  params: Promise<{ usageId: string }>;
};

export default async function SafetyCostEvidencePage({
  params,
}: SafetyCostEvidencePageProps) {
  const { usageId } = await params;
  const pageData = await loadSafetyCostDetailPageData(usageId);

  return (
    <ErpShell
      title={`산안비 증빙 · ${pageData.detail.ownerDisplayName}`}
      subtitle="증빙파일 업로드, 웹하드 연결, 메일 첨부 보관 흐름을 검토합니다."
    >
      <div className="section-stack">
        <SafetyCostEvidenceUploader
          evidenceItems={pageData.detail.evidenceItems}
          usageId={pageData.detail.usage.id}
        />
        <SafetyCostEvidenceTable items={pageData.detail.evidenceItems} />
      </div>
    </ErpShell>
  );
}
