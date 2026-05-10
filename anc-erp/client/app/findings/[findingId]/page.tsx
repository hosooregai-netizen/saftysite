import { ErpShell } from "../../../components/erp-shell";
import { FindingPhotoGallery } from "../../../components/finding-photo-gallery";
import { FindingSourceLinkPanel } from "../../../components/finding-source-link-panel";
import { FindingTimeline } from "../../../components/finding-timeline";
import { loadFindingDetailPageData } from "../../../lib/finding-page-data";

type FindingDetailPageProps = {
  params: Promise<{ findingId: string }>;
};

export default async function FindingDetailPage({ params }: FindingDetailPageProps) {
  const { findingId } = await params;
  const pageData = await loadFindingDetailPageData(findingId);

  return (
    <ErpShell
      title={`지적사항 상세 · ${pageData.detail.finding.title}`}
      subtitle="지적사항, 조치현황, 사진, 이력을 한 곳에서 검토합니다."
    >
      <section className="feature-split">
        <div className="section-stack">
          <FindingSourceLinkPanel finding={pageData.detail.finding} />
          <FindingPhotoGallery findingId={pageData.detail.finding.id} photos={pageData.detail.photos} />
        </div>
        <div className="section-stack">
          <FindingTimeline events={pageData.detail.timeline} />
        </div>
      </section>
    </ErpShell>
  );
}
