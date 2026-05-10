import { DashboardShell, ProjectHealthTable, ProjectRiskHeatmap } from "../../../components/dashboard-components";
import { loadDashboardProjectsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardProjectsPage() {
  const pageData = await loadDashboardProjectsPageData();

  return (
    <DashboardShell title="프로젝트 Health" subtitle="프로젝트별 위험 점수, 지적사항, 제출 지연을 비교해 운영 우선순위를 잡습니다.">
      <div className="feature-split">
        <div className="section-stack">
          <ProjectHealthTable items={pageData.healthMetrics} />
        </div>
        <div className="section-stack">
          <ProjectRiskHeatmap items={pageData.healthMetrics} />
        </div>
      </div>
    </DashboardShell>
  );
}

