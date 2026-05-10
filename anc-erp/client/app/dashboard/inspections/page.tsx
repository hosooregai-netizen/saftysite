import { DashboardShell, MonthlyInspectionChart } from "../../../components/dashboard-components";
import { loadDashboardInspectionsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardInspectionsPage() {
  const pageData = await loadDashboardInspectionsPageData();

  return (
    <DashboardShell title="점검 통계" subtitle="회차 현황과 월별 점검량을 함께 보며 운영 밀도를 조정합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Inspection Status</p>
                <h3 className="panel-title">점검회차 상태 목록</h3>
              </div>
            </div>
            <div className="table-like">
              {pageData.metrics.map((metric) => (
                <div className="table-row" key={metric.id}>
                  <div>
                    <strong>{metric.label}</strong>
                    <p className="table-subtext">{String(metric.metadata.plannedDate ?? "")}</p>
                  </div>
                  <strong>{String(metric.metadata.roundStatus ?? "")}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="section-stack">
          <MonthlyInspectionChart stats={pageData.monthlyInspections} />
        </div>
      </div>
    </DashboardShell>
  );
}

