import { ErpShell } from "../../../../components/erp-shell";
import { PhotoLedgerA4Preview } from "../../../../components/photo-ledger-a4-preview";
import { PhotoLedgerExportChecklist } from "../../../../components/photo-ledger-export-checklist";
import { loadPhotoLedgerDetailPageData, loadPhotoLedgerValidationData } from "../../../../lib/finding-page-data";

type PhotoLedgerPreviewPageProps = {
  params: Promise<{ photoLedgerId: string }>;
};

export default async function PhotoLedgerPreviewPage({ params }: PhotoLedgerPreviewPageProps) {
  const { photoLedgerId } = await params;
  const pageData = await loadPhotoLedgerDetailPageData(photoLedgerId);
  const validationData = await loadPhotoLedgerValidationData(photoLedgerId);

  return (
    <ErpShell title={`사진대지 미리보기 · ${photoLedgerId}`} subtitle="A4 미리보기와 export 전 경고를 함께 검토합니다.">
      <section className="feature-split">
        <div className="section-stack">
          <PhotoLedgerA4Preview detail={pageData.detail} />
        </div>
        <div className="section-stack">
          <PhotoLedgerExportChecklist photoLedgerId={photoLedgerId} warnings={validationData.validation.warnings} />
        </div>
      </section>
    </ErpShell>
  );
}
