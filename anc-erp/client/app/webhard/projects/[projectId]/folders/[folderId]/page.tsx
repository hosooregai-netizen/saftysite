import { FileList } from "../../../../../../components/file-list";
import { FolderBreadcrumb } from "../../../../../../components/folder-breadcrumb";
import { MoveCopyModal } from "../../../../../../components/move-copy-modal";
import { ProjectFolderTree } from "../../../../../../components/project-folder-tree";
import { RenameModal } from "../../../../../../components/rename-modal";
import { StorageUsageCard } from "../../../../../../components/storage-usage-card";
import { UploadDropzone } from "../../../../../../components/upload-dropzone";
import { UploadQueue } from "../../../../../../components/upload-queue";
import { WebhardLeftRail } from "../../../../../../components/webhard-left-rail";
import { WebhardShell } from "../../../../../../components/webhard-shell";
import { loadFolderPageData } from "../../../../../../lib/webhard-page-data";

type FolderPageProps = {
  params: Promise<{ projectId: string; folderId: string }>;
};

export default async function FolderPage({ params }: FolderPageProps) {
  const { projectId, folderId } = await params;
  const pageData = await loadFolderPageData(projectId, folderId);

  return (
    <WebhardShell
      title={pageData.folder.name}
      subtitle="현재 폴더 기준 업로드, 보기 전환, 공유, 상세 확인을 수행합니다."
      activeSection="project"
      projectId={projectId}
      leftRail={<WebhardLeftRail activeView="project" projectId={projectId} />}
      folderTree={<ProjectFolderTree projectId={projectId} tree={pageData.tree} />}
      detailPanel={
        <div className="content-grid">
          <StorageUsageCard usage={pageData.storageUsage} />
          <RenameModal currentName={pageData.folder.name} />
          <MoveCopyModal folderPath={pageData.folder.path} />
        </div>
      }
    >
      <section className="hero-card webhard-folder-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Folder Browser</p>
            <h2 className="hero-title">{pageData.folder.name}</h2>
            <p className="hero-subtitle">
              현재 폴더 기준으로 업로드 큐, 경로, 하위 파일 상태를 함께 보면서 문서 보관 위치를 정리합니다.
            </p>
          </div>
          <div className="hero-badges">
            <span className="status review">{pageData.folder.type}</span>
            <span className="status success">{pageData.files.length} files</span>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>폴더 경로</span>
            <strong>{pageData.folder.path}</strong>
          </article>
          <article className="hero-summary-card">
            <span>시스템 폴더</span>
            <strong>{pageData.folder.isSystem ? "yes" : "no"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>보관 상태</span>
            <strong>{pageData.folder.isArchived ? "archived" : "active"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>데이터 소스</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      </section>
      <FolderBreadcrumb folder={pageData.folder} />
      <UploadDropzone folderId={pageData.folder.id} projectId={projectId} />
      <UploadQueue items={pageData.files.map((item) => item.fileName).slice(0, 5)} />
      <FileList files={pageData.files} />
    </WebhardShell>
  );
}
