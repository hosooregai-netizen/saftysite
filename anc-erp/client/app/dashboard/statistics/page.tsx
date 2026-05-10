import {
  DashboardShell,
  ExportSummaryChart,
  MonthlyInspectionChart,
  MonthlySubmissionChart,
  OwnerSubmissionLagChart,
  RiskTypeDistributionChart,
} from "../../../components/dashboard-components";
import { StatusBadge } from "../../../components/status-badge";
import { loadDashboardStatisticsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardStatisticsPage() {
  const pageData = await loadDashboardStatisticsPageData();

  return (
    <DashboardShell title="통계 허브" subtitle="월별 점검/제출, 위험유형, 발주처 제출 지연, export 요약을 집계합니다.">
      <section className="hero-card dashboard-hero-card">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Statistics Workspace</p>
            <h2 className="hero-title">기간/프로젝트/발주처 기준 통계</h2>
            <p className="hero-subtitle">
              chart와 표를 함께 보여주고, 각 수치에는 기준기간과 원본 집계 성격을 함께 노출합니다.
            </p>
          </div>
        </div>
        <div className="dashboard-command-strip">
          <span className="pill outline">기간 필터</span>
          <span className="pill outline">프로젝트 필터</span>
          <span className="pill outline">발주처 필터</span>
          <span className="pill outline">직접 선택</span>
        </div>
        <div className="hero-summary-grid dashboard-kpi-grid">
          <article className="hero-summary-card dashboard-metric-card">
            <span>기준일</span>
            <strong>오늘 기준</strong>
            <small>오늘/이번 주/이번 달/직접 선택 필터를 동일하게 적용합니다.</small>
          </article>
          <article className="hero-summary-card dashboard-metric-card review">
            <span>원본 모델</span>
            <strong>Inspection · Submission · Finding</strong>
            <small>차트와 표 모두 원본 집계값만 표시합니다.</small>
          </article>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <MonthlyInspectionChart stats={pageData.monthlyInspections} />
          <MonthlySubmissionChart stats={pageData.monthlySubmissions} />
          <OwnerSubmissionLagChart stats={pageData.ownerLag} />
        </div>
        <div className="section-stack">
          <RiskTypeDistributionChart stats={pageData.riskTypes} />
          <ExportSummaryChart stats={pageData.exportSummary} />
          <section className="missing-panel dashboard-inline-warning">
            <div className="hero-badges">
              <StatusBadge tone="warning" label="계산 기준 확인" />
              <span className="pill subtle">source metric only</span>
            </div>
            <p className="helper-text">
              일부 통계는 필수 원본 데이터가 없으면 계산되지 않을 수 있으며, 표의 각 행은 기준기간과 원본 seriesKey를 함께 표시합니다.
            </p>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
