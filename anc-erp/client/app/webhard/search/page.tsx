import { FileList } from "../../../components/file-list";
import { WebhardLeftRail } from "../../../components/webhard-left-rail";
import { WebhardShell } from "../../../components/webhard-shell";
import { loadSearchPageData } from "../../../lib/webhard-page-data";

export default async function WebhardSearchPage() {
  const pageData = await loadSearchPageData("보고서");

  return (
    <WebhardShell
      title="파일 검색"
      subtitle="프로젝트, 태그, 연결 대상, 텍스트 기준으로 파일을 검색합니다."
      activeSection="search"
      leftRail={<WebhardLeftRail activeView="search" projectId="project-sample-001" />}
      folderTree={null}
      detailPanel={null}
    >
      <FileList files={pageData.items} />
    </WebhardShell>
  );
}
