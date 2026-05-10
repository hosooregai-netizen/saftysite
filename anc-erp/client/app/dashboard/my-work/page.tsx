import { ApprovalQueueCard, DashboardShell, MyTaskQueue, UpcomingInspectionList } from "../../../components/dashboard-components";
import { loadDashboardMyWorkPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardMyWorkPage() {
  const pageData = await loadDashboardMyWorkPageData();

  return (
    <DashboardShell title="My Work" subtitle="오늘 바로 처리해야 하는 업무 큐만 모아 보는 개인 관제 화면입니다.">
      <div className="feature-split">
        <div className="section-stack">
          <MyTaskQueue tasks={pageData.tasks} />
        </div>
        <div className="section-stack">
          <UpcomingInspectionList rounds={pageData.upcomingInspections} />
          <ApprovalQueueCard approvals={pageData.pendingApprovals} />
        </div>
      </div>
    </DashboardShell>
  );
}
