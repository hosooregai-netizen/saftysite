import { FileVersionPanel } from "../../../../components/file-version-panel";
import { WebhardLeftRail } from "../../../../components/webhard-left-rail";
import { WebhardShell } from "../../../../components/webhard-shell";
import { loadFileVersionsPageData } from "../../../../lib/webhard-page-data";

type FileVersionsPageProps = {
  params: Promise<{ fileId: string }>;
};

export default async function FileVersionsPage({ params }: FileVersionsPageProps) {
  const { fileId } = await params;
  const pageData = await loadFileVersionsPageData(fileId);

  return (
    <WebhardShell
      title="파일 버전"
      subtitle="원본, 작업본, 검토본, 최종본, 제출본 버전을 구분해 관리합니다."
      activeSection="project"
      projectId={pageData.detail.file.projectId}
      leftRail={<WebhardLeftRail activeView="project" projectId={pageData.detail.file.projectId} />}
      folderTree={null}
      detailPanel={null}
    >
      <FileVersionPanel fileId={pageData.detail.file.id} versions={pageData.versions} />
    </WebhardShell>
  );
}
