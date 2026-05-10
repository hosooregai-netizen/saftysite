import { ShareLinkModal } from "../../../components/share-link-modal";
import { ShareLinkList } from "../../../components/share-link-list";
import { WebhardLeftRail } from "../../../components/webhard-left-rail";
import { WebhardShell } from "../../../components/webhard-shell";
import { loadSharedPageData } from "../../../lib/webhard-page-data";

export default async function WebhardSharedPage() {
  const pageData = await loadSharedPageData();

  return (
    <WebhardShell
      title="공유 파일"
      subtitle="공유 링크가 생성된 파일과 폴더를 한 곳에서 관리합니다."
      activeSection="shared"
      leftRail={<WebhardLeftRail activeView="shared" projectId="project-sample-001" />}
      folderTree={null}
      detailPanel={
        <ShareLinkModal
          fileId={pageData.sharedLinks.find((item) => item.fileId)?.fileId ?? undefined}
          projectId={pageData.sharedLinks[0]?.projectId ?? "project-sample-001"}
        />
      }
    >
      <section className="hero-card webhard-shared-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Shared Files</p>
            <h2 className="hero-title">외부 전달용 링크를 권한과 만료 기준으로 관리하는 공유 보드</h2>
            <p className="hero-subtitle">revoked, active, download 권한을 바로 구분해서 회수 누락을 줄이는 화면입니다.</p>
          </div>
          <div className="hero-badges">
            <span className="status submitted">
              active {pageData.sharedLinks.filter((item) => !item.isRevoked).length}
            </span>
            <span className="status danger">
              revoked {pageData.sharedLinks.filter((item) => item.isRevoked).length}
            </span>
          </div>
        </div>
      </section>
      <ShareLinkList items={pageData.sharedLinks} />
    </WebhardShell>
  );
}
