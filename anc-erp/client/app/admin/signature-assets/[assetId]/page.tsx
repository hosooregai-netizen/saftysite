import { SubmissionDetailCard } from "../../../../components/admin-governance-components";
import { ErpShell } from "../../../../components/erp-shell";
import { SealAssetPicker } from "../../../../components/seal-asset-picker";
import { SignatureAssetPicker } from "../../../../components/signature-asset-picker";
import { SignatureAssetTable } from "../../../../components/signature-asset-table";
import { loadAdminSignatureAssetDetailPageData } from "../../../../lib/admin-page-data";

type SignatureAssetDetailPageProps = {
  params: Promise<{ assetId: string }>;
};

export default async function SignatureAssetDetailPage({ params }: SignatureAssetDetailPageProps) {
  const { assetId } = await params;
  const pageData = await loadAdminSignatureAssetDetailPageData(assetId);

  return (
    <ErpShell title={`Signature Asset: ${assetId}`} subtitle="개별 서명 자산 상세 화면입니다.">
      <SubmissionDetailCard detail={pageData.detail} />
      <SignatureAssetTable items={[pageData.detail]} />
      <SignatureAssetPicker items={[pageData.detail]} mode="admin" />
      <SealAssetPicker items={[pageData.detail]} mode="admin" />
    </ErpShell>
  );
}
