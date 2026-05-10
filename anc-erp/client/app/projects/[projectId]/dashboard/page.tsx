import {
  ApprovalQueueCard,
  DashboardShell,
  DashboardInsightPanel,
  FindingAgingChart,
  MailFileActivityCard,
  OwnerReportStatusMatrix,
  ProjectDashboardHeader,
  ProjectFindingTable,
  ProjectRiskHeatmap,
  SafetyCostUsageCard,
} from "../../../../components/dashboard-components";
import { loadDashboardInsightPanelData, loadProjectDashboardPageData } from "../../../../lib/dashboard-page-data";

type ProjectDashboardPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDashboardPage({ params }: ProjectDashboardPageProps) {
  const { projectId } = await params;
  const [pageData, insight] = await Promise.all([
    loadProjectDashboardPageData(projectId),
    loadDashboardInsightPanelData(projectId),
  ]);

  return (
    <DashboardShell
      title="Project Dashboard"
      subtitle="프로젝트 health summary와 발주처별 제출/지적/메일 활동을 프로젝트 범위에서만 관제합니다."
    >
      <ProjectDashboardHeader project={pageData.dashboard.project} healthMetric={pageData.dashboard.healthMetric} />
      <div className="feature-split">
        <div className="section-stack">
          <ProjectRiskHeatmap items={[pageData.dashboard.healthMetric]} />
          <OwnerReportStatusMatrix items={pageData.dashboard.ownerReportMatrix} />
          <ProjectFindingTable items={pageData.dashboard.openFindings} />
        </div>
        <div className="section-stack">
          <FindingAgingChart buckets={pageData.dashboard.findingAging} />
          <ApprovalQueueCard approvals={pageData.dashboard.pendingApprovals} />
          <SafetyCostUsageCard warnings={pageData.dashboard.safetyCostWarnings} />
          <MailFileActivityCard activity={pageData.dashboard.mailFileActivity} />
          <DashboardInsightPanel insightRun={insight.insightRun} />
        </div>
      </div>
    </DashboardShell>
  );
}
