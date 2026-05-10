import { ErpShell } from "../../../../components/erp-shell";
import { PhotoCaptionEditor } from "../../../../components/photo-caption-editor";
import { PhotoGrid } from "../../../../components/photo-grid";
import { PhotoMarkupEditor } from "../../../../components/photo-markup-editor";
import { PhotoUploader } from "../../../../components/photo-uploader";
import { loadFindingDetailPageData } from "../../../../lib/finding-page-data";

type FindingPhotosPageProps = {
  params: Promise<{ findingId: string }>;
};

export default async function FindingPhotosPage({ params }: FindingPhotosPageProps) {
  const { findingId } = await params;
  const pageData = await loadFindingDetailPageData(findingId);
  const primaryPhoto = pageData.detail.photos[0];

  return (
    <ErpShell title={`사진 관리 · ${findingId}`} subtitle="지적사진, 조치사진, 마크업, 캡션을 관리합니다.">
      <section className="feature-split">
        <div className="section-stack">
          <PhotoUploader findingId={findingId} />
          <PhotoGrid photos={pageData.detail.photos} />
        </div>
        <div className="section-stack">
          {primaryPhoto ? <PhotoMarkupEditor photo={primaryPhoto} /> : null}
          {primaryPhoto ? <PhotoCaptionEditor photo={primaryPhoto} /> : null}
        </div>
      </section>
    </ErpShell>
  );
}
