import { CorrectiveActionQueue, DashboardShell, FindingAgingChart, OpenFindingCard, RiskTypeDistributionChart } from "../../../components/dashboard-components";
import { loadDashboardFindingsPageData, loadDashboardOverviewPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardFindingsPage() {
  const [pageData, overview] = await Promise.all([
    loadDashboardFindingsPageData(),
    loadDashboardOverviewPageData(),
  ]);

  return (
    <DashboardShell title="지적사항 통계" subtitle="미조치, 경과일, 위험유형 분포를 함께 보며 follow-up 우선순위를 정합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <OpenFindingCard count={pageData.aging.reduce((sum, bucket) => sum + bucket.count, 0)} />
          <FindingAgingChart buckets={pageData.aging} />
          <RiskTypeDistributionChart stats={pageData.riskTypes} />
        </div>
        <div className="section-stack">
          <CorrectiveActionQueue items={overview.overview.openFindings} />
        </div>
      </div>
    </DashboardShell>
  );
}
