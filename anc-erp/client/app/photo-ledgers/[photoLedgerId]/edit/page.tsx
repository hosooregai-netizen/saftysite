import { ErpShell } from "../../../../components/erp-shell";
import { MissingPhotoWarningPanel } from "../../../../components/missing-photo-warning-panel";
import { PhotoCaptionEditor } from "../../../../components/photo-caption-editor";
import { PhotoLedgerEntryCard } from "../../../../components/photo-ledger-entry-card";
import { loadPhotoLedgerDetailPageData } from "../../../../lib/finding-page-data";

type PhotoLedgerEditPageProps = {
  params: Promise<{ photoLedgerId: string }>;
};

export default async function PhotoLedgerEditPage({ params }: PhotoLedgerEditPageProps) {
  const { photoLedgerId } = await params;
  const pageData = await loadPhotoLedgerDetailPageData(photoLedgerId);
  const primaryPhoto = pageData.detail.photos[0];

  return (
    <ErpShell title={`사진대지 편집 · ${photoLedgerId}`} subtitle="매칭, 캡션, 순서, 누락 사진 경고를 확인합니다.">
      <section className="feature-split">
        <div className="section-stack">
          {pageData.detail.entries.map((entry) => (
            <PhotoLedgerEntryCard entry={entry} key={entry.id} />
          ))}
        </div>
        <div className="section-stack">
          {primaryPhoto ? <PhotoCaptionEditor photo={primaryPhoto} /> : null}
          <MissingPhotoWarningPanel warnings={pageData.detail.warnings} />
        </div>
      </section>
    </ErpShell>
  );
}
