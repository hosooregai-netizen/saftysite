import { ErpShell } from "../../../../components/erp-shell";
import { VerificationPanel } from "../../../../components/verification-panel";
import { loadFindingDetailPageData } from "../../../../lib/finding-page-data";

type FindingVerifyPageProps = {
  params: Promise<{ findingId: string }>;
};

export default async function FindingVerifyPage({ params }: FindingVerifyPageProps) {
  const { findingId } = await params;
  const pageData = await loadFindingDetailPageData(findingId);

  return (
    <ErpShell title={`조치 확인 · ${findingId}`} subtitle="조치 제출본을 확인하거나 반려합니다.">
      <VerificationPanel actions={pageData.detail.correctiveActions} />
    </ErpShell>
  );
}
