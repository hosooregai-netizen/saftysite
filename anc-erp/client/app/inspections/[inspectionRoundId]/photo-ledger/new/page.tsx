import { ErpShell } from "../../../../../components/erp-shell";
import { OwnerPhotoLedgerFilter } from "../../../../../components/owner-photo-ledger-filter";

type NewPhotoLedgerPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function NewPhotoLedgerPage({ params }: NewPhotoLedgerPageProps) {
  const { inspectionRoundId } = await params;

  return (
    <ErpShell title={`사진대지 생성 · ${inspectionRoundId}`} subtitle="발주처별 사진대지 초안을 생성합니다.">
      <OwnerPhotoLedgerFilter ownerNames={["삼성문화재단", "삼성생명공익재단"]} />
    </ErpShell>
  );
}
