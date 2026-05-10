import { ErpShell } from "../../../components/erp-shell";
import { PhotoLedgerA4Preview } from "../../../components/photo-ledger-a4-preview";
import { PhotoLedgerEntryTable } from "../../../components/photo-ledger-entry-table";
import { loadPhotoLedgerDetailPageData } from "../../../lib/finding-page-data";

type PhotoLedgerDetailPageProps = {
  params: Promise<{ photoLedgerId: string }>;
};

export default async function PhotoLedgerDetailPage({ params }: PhotoLedgerDetailPageProps) {
  const { photoLedgerId } = await params;
  const pageData = await loadPhotoLedgerDetailPageData(photoLedgerId);

  return (
    <ErpShell title={`사진대지 상세 · ${photoLedgerId}`} subtitle="발주처별 사진대지 상세와 항목 순서를 검토합니다.">
      <section className="section-stack">
        <PhotoLedgerA4Preview detail={pageData.detail} />
        <PhotoLedgerEntryTable entries={pageData.detail.entries} />
      </section>
    </ErpShell>
  );
}
