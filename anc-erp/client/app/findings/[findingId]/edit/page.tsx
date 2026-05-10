import { ErpShell } from "../../../../components/erp-shell";
import { FindingForm } from "../../../../components/finding-form";
import { loadFindingDetailPageData } from "../../../../lib/finding-page-data";

type FindingEditPageProps = {
  params: Promise<{ findingId: string }>;
};

export default async function FindingEditPage({ params }: FindingEditPageProps) {
  const { findingId } = await params;
  const pageData = await loadFindingDetailPageData(findingId);

  return (
    <ErpShell title={`지적사항 수정 · ${findingId}`} subtitle="제목, 상세, 기한, 발주처 연결을 수정합니다.">
      <FindingForm finding={pageData.detail.finding} inspectionRoundId={pageData.detail.finding.inspectionRoundId} title="지적사항 수정" />
    </ErpShell>
  );
}
