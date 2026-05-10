import { FileList } from "../../../components/file-list";
import { StorageUsageCard } from "../../../components/storage-usage-card";
import { WebhardLeftRail } from "../../../components/webhard-left-rail";
import { WebhardShell } from "../../../components/webhard-shell";
import { loadWebhardHomePageData } from "../../../lib/webhard-page-data";

export default async function WebhardRecentPage() {
  const pageData = await loadWebhardHomePageData();

  return (
    <WebhardShell
      title="최근 파일"
      subtitle="최근 업로드 및 수정된 파일을 프로젝트 연결 기준으로 확인합니다."
      activeSection="recent"
      leftRail={<WebhardLeftRail activeView="recent" projectId="project-sample-001" />}
      folderTree={<StorageUsageCard usage={pageData.storageUsage} />}
      detailPanel={null}
    >
      <FileList files={pageData.recentFiles} />
    </WebhardShell>
  );
}
