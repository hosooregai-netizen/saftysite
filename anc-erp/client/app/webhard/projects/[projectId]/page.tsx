import { FileDetailPanel } from "../../../../components/file-detail-panel";
import { FileGrid } from "../../../../components/file-grid";
import { FileList } from "../../../../components/file-list";
import { MailAttachmentSavePanel } from "../../../../components/mail-attachment-save-panel";
import { NewFolderModal } from "../../../../components/new-folder-modal";
import { ProjectFolderTree } from "../../../../components/project-folder-tree";
import { StorageUsageCard } from "../../../../components/storage-usage-card";
import { WebhardCommandBar } from "../../../../components/webhard-command-bar";
import { WebhardLeftRail } from "../../../../components/webhard-left-rail";
import { WebhardShell } from "../../../../components/webhard-shell";
import { loadProjectWebhardPageData } from "../../../../lib/webhard-page-data";

type ProjectWebhardPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectWebhardPage({ params }: ProjectWebhardPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectWebhardPageData(projectId);
  const generatedCount = pageData.files.filter((file) => file.source === "generated_document").length;
  const mailCount = pageData.files.filter((file) => file.source === "mail_attachment").length;

  return (
    <WebhardShell
      title={`프로젝트 웹하드 · ${projectId}`}
      subtitle="프로젝트 폴더 트리와 파일 목록을 함께 보면서 문서·점검·메일·제출 연결을 유지합니다."
      activeSection="project"
      projectId={projectId}
      leftRail={<WebhardLeftRail activeView="project" projectId={projectId} />}
      folderTree={<ProjectFolderTree projectId={projectId} tree={pageData.tree} />}
      detailPanel={
        pageData.featuredFileDetail ? (
          <div className="content-grid">
            <FileDetailPanel detail={pageData.featuredFileDetail} />
            <MailAttachmentSavePanel projectId={projectId} />
          </div>
        ) : (
          <div className="content-grid">
            <StorageUsageCard usage={pageData.storageUsage} />
            <MailAttachmentSavePanel projectId={projectId} />
          </div>
        )
      }
    >
      <WebhardCommandBar folderId={pageData.tree[0]?.folder.id} projectId={projectId} />
      <section className="hero-card webhard-project-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Project Webhard</p>
            <h2 className="hero-title">프로젝트 기준 파일 계층과 연결 상태를 동시에 보는 운영 화면</h2>
            <p className="hero-subtitle">
              폴더별 파일을 비교하면서 generated document, mail attachment, locked file 비중을 바로 확인합니다.
            </p>
          </div>
          <div className="hero-badges">
            <span className="status submitted">문서 {generatedCount}</span>
            <span className="status warning">메일 {mailCount}</span>
            <span className="status review">잠금 {pageData.storageUsage.lockedFiles}</span>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>전체 파일</span>
            <strong>{pageData.files.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>공유 링크</span>
            <strong>{pageData.sharedLinks.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>활동 이력</span>
            <strong>{pageData.activities.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>데이터 소스</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      </section>
      <NewFolderModal projectId={projectId} />
      <FileList files={pageData.files} />
      <FileGrid files={pageData.files.slice(0, 6)} />
    </WebhardShell>
  );
}
