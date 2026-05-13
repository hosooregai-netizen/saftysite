import { FileActivityTimeline } from "../../../../components/file-activity-timeline";
import { WebhardLeftRail } from "../../../../components/webhard-left-rail";
import { WebhardShell } from "../../../../components/webhard-shell";
import { loadFileActivityPageData } from "../../../../lib/webhard-page-data";

type FileActivityPageProps = {
  params: Promise<{ fileId: string }>;
};

export default async function FileActivityPage({ params }: FileActivityPageProps) {
  const { fileId } = await params;
  const pageData = await loadFileActivityPageData(fileId);

  return (
    <WebhardShell
      title="파일 활동 이력"
      subtitle="업로드, 이동, 공유, 복구, 잠금, 다운로드 이력을 시간순으로 확인합니다."
      activeSection="project"
      projectId={pageData.detail.file.projectId}
      leftRail={<WebhardLeftRail activeView="project" projectId={pageData.detail.file.projectId} />}
      folderTree={null}
      detailPanel={null}
    >
      <FileActivityTimeline activities={pageData.activities} />
    </WebhardShell>
  );
}

