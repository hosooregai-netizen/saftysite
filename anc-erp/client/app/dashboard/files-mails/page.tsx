import { DashboardShell, MailFileActivityCard, UnclassifiedMailList } from "../../../components/dashboard-components";
import { loadDashboardFilesMailsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardFilesMailsPage() {
  const pageData = await loadDashboardFilesMailsPageData();

  return (
    <DashboardShell title="파일 / 메일 활동" subtitle="최근 웹하드 활동과 메일 흐름을 묶어 누락 링크나 미분류 메시지를 빠르게 찾습니다.">
      <div className="feature-split">
        <div className="section-stack">
          <MailFileActivityCard activity={pageData.activity} />
        </div>
        <div className="section-stack">
          <UnclassifiedMailList messages={pageData.activity.unclassifiedMessages ?? []} />
        </div>
      </div>
    </DashboardShell>
  );
}
