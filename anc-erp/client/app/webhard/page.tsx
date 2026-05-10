import { FileGrid } from "../../components/file-grid";
import { MailAttachmentSavePanel } from "../../components/mail-attachment-save-panel";
import { ShareLinkList } from "../../components/share-link-list";
import { StorageUsageCard } from "../../components/storage-usage-card";
import { TrashTable } from "../../components/trash-table";
import { WebhardCommandBar } from "../../components/webhard-command-bar";
import { WebhardLeftRail } from "../../components/webhard-left-rail";
import { WebhardShell } from "../../components/webhard-shell";
import { loadWebhardHomePageData } from "../../lib/webhard-page-data";

export default async function WebhardPage() {
  const pageData = await loadWebhardHomePageData();
  const recentDocumentCount = pageData.recentFiles.filter((file) => file.source === "generated_document").length;
  const sharedCount = pageData.sharedLinks.filter((item) => !item.isRevoked).length;

  return (
    <WebhardShell
      title="웹하드"
      subtitle="프로젝트 산출물, 메일 첨부, 최종본, 사진 원본을 함께 관리하는 full-screen 파일 관리자입니다."
      activeSection="home"
      leftRail={<WebhardLeftRail activeView="home" projectId="project-sample-001" />}
      folderTree={<StorageUsageCard usage={pageData.storageUsage} />}
      detailPanel={<MailAttachmentSavePanel projectId="project-sample-001" />}
    >
      <WebhardCommandBar projectId="project-sample-001" />
      <section className="hero-card webhard-home-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Webhard Overview</p>
            <h2 className="hero-title">프로젝트 파일, 공유본, 휴지통을 한 화면에서 관리하는 웹하드 허브</h2>
            <p className="hero-subtitle">
              생성 문서, 메일 첨부, 현장 사진 원본을 파일 상태 배지와 연결 대상 기준으로 빠르게 검토할 수 있습니다.
            </p>
          </div>
          <div className="hero-badges">
            <span className="status success">active {pageData.storageUsage.activeFiles}</span>
            <span className="status review">locked {pageData.storageUsage.lockedFiles}</span>
            <span className="status submitted">shared {sharedCount}</span>
            <span className="status danger">trash {pageData.storageUsage.deletedFiles}</span>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>최근 파일</span>
            <strong>{pageData.recentFiles.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>생성 문서</span>
            <strong>{recentDocumentCount}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>활성 공유 링크</span>
            <strong>{sharedCount}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>데이터 소스</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      </section>
      <FileGrid files={pageData.recentFiles} />
      <ShareLinkList items={pageData.sharedLinks} />
      <TrashTable items={pageData.trashFiles} />
    </WebhardShell>
  );
}
