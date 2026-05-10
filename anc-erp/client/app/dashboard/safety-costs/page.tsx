import { DashboardShell, SafetyCostUsageCard, SafetyCostUsageChart } from "../../../components/dashboard-components";
import { loadDashboardSafetyCostsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardSafetyCostsPage() {
  const pageData = await loadDashboardSafetyCostsPageData();

  return (
    <DashboardShell title="산안비 통계" subtitle="증빙 누락, 검토 미확정, 사용률 편차를 한 화면에서 점검합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <SafetyCostUsageCard warnings={pageData.warnings} />
        </div>
        <div className="section-stack">
          <SafetyCostUsageChart stats={pageData.distribution} />
        </div>
      </div>
    </DashboardShell>
  );
}

