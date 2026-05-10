import { ErpShell } from "../../../../components/erp-shell";
import { PhotoLedgerExportChecklist } from "../../../../components/photo-ledger-export-checklist";
import { loadPhotoLedgerValidationData } from "../../../../lib/finding-page-data";

type PhotoLedgerExportPageProps = {
  params: Promise<{ photoLedgerId: string }>;
};

export default async function PhotoLedgerExportPage({ params }: PhotoLedgerExportPageProps) {
  const { photoLedgerId } = await params;
  const validationData = await loadPhotoLedgerValidationData(photoLedgerId);

  return (
    <ErpShell title={`사진대지 export · ${photoLedgerId}`} subtitle="확정 항목 기준 export 전 마지막 경고를 검토합니다.">
      <PhotoLedgerExportChecklist photoLedgerId={photoLedgerId} warnings={validationData.validation.warnings} />
    </ErpShell>
  );
}
