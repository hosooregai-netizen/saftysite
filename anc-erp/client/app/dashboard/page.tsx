import {
  AlertList,
  ApprovalQueueCard,
  DashboardInsightPanel,
  DashboardShell,
  DashboardWidgetGrid,
  FindingAgingChart,
  MailFileActivityCard,
  OpenFindingCard,
  ProjectHealthTable,
  ReportDueCard,
  SafetyCostUsageCard,
  SubmissionStatusCard,
  TodayInspectionCard,
  UpcomingInspectionList,
} from "../../components/dashboard-components";
import { StatusBadge } from "../../components/status-badge";
import {
  loadDashboardApprovalsPageData,
  loadDashboardAlertsPageData,
  loadDashboardFilesMailsPageData,
  loadDashboardFindingsPageData,
  loadDashboardInsightPanelData,
  loadDashboardInspectionsPageData,
  loadDashboardOverviewPageData,
  loadDashboardProjectsPageData,
  loadDashboardReportsPageData,
  loadDashboardSafetyCostsPageData,
  loadDashboardSettingsPageData,
} from "../../lib/dashboard-page-data";
import type { InspectionRound } from "../../../packages/contracts/src";

export default async function DashboardPage() {
  const [
    overviewData,
    settingsData,
    projectData,
    inspectionData,
    reportData,
    findingsData,
    approvalsData,
    safetyCostData,
    filesMailData,
    alertsData,
    insight,
  ] = await Promise.all([
    loadDashboardOverviewPageData(),
    loadDashboardSettingsPageData(),
    loadDashboardProjectsPageData(),
    loadDashboardInspectionsPageData(),
    loadDashboardReportsPageData(),
    loadDashboardFindingsPageData(),
    loadDashboardApprovalsPageData(),
    loadDashboardSafetyCostsPageData(),
    loadDashboardFilesMailsPageData(),
    loadDashboardAlertsPageData(),
    loadDashboardInsightPanelData(),
  ]);
  const inspectionRounds: InspectionRound[] = inspectionData.metrics.map((metric) => ({
    id: String(metric.inspectionRoundId ?? metric.id),
    projectId: String(metric.projectId ?? "global"),
    name: metric.label,
    status: String(metric.metadata.roundStatus ?? metric.status) as InspectionRound["status"],
    roundNo: typeof metric.value === "number" ? metric.value : Number(metric.value),
    documentNo: String(metric.metadata.documentNo ?? "") || null,
    plannedDate: String(metric.metadata.plannedDate ?? "") || null,
    actualInspectionDate: String(metric.metadata.actualInspectionDate ?? "") || null,
    documentInstances: [],
  }));
  const todayInspectionRounds = inspectionRounds.filter(
    (round) => (round.actualInspectionDate || round.plannedDate) === overviewData.overview.snapshot.snapshotDate,
  );
  const upcomingInspectionRounds = inspectionRounds
    .filter((round) => (round.plannedDate || "9999-12-31") >= overviewData.overview.snapshot.snapshotDate)
    .slice(0, 5);
  const openFindingCount = findingsData.aging.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="원본 업무는 각 모듈에서 처리하고, 여기서는 전역 KPI와 경고, 프로젝트 health만 관제합니다."
    >
      <div className="feature-split">
        <div className="section-stack">
          <section className="hero-card dashboard-hero-card">
            <div className="hero-head">
              <div>
                <p className="card-eyebrow">Feature 14 · Global Dashboard</p>
                <h2 className="hero-title">전역 대시보드 / 통계 허브</h2>
                <p className="hero-subtitle">
                  Project, InspectionRound, DocumentInstance에 흩어진 상태를 읽기 전용으로 모아
                  오늘 업무, 지연, 경고, 제출 상태를 한 화면에서 확인합니다.
                </p>
              </div>
              <div className="hero-badges">
                <StatusBadge tone={overviewData.dataSource === "api" ? "success" : "review"} label={overviewData.dataSource === "api" ? "API 연결" : "샘플 fallback"} />
                <StatusBadge tone="info" label="Global dashboard" />
                <StatusBadge tone="neutral" label={`snapshot ${overviewData.overview.snapshot.snapshotDate}`} />
              </div>
            </div>
            <div className="dashboard-command-strip">
              <span className="pill outline">오늘</span>
              <span className="pill outline">이번 주</span>
              <span className="pill outline">이번 달</span>
              <span className="pill outline">권한 범위만 표시</span>
            </div>
            <div className="hero-summary-grid dashboard-kpi-grid">
              {overviewData.overview.metrics.slice(0, 4).map((metric) => (
                <article className="hero-summary-card" key={metric.id}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}{metric.unit ?? ""}</strong>
                  <small>{metric.route ?? "원본 route에서 처리"}</small>
                </article>
              ))}
            </div>
            <div className="dashboard-overview-grid">
              <section className="dashboard-warning-strip">
                <strong>운영 규칙</strong>
                <span>완료 처리, 제출 처리, 조치 확인은 여기서 하지 않고 원본 모듈로 이동해서 수행합니다.</span>
              </section>
              <section className="missing-panel dashboard-inline-warning">
                <div className="hero-badges">
                  <StatusBadge tone="warning" label="권한 범위 표시" />
                  <span className="pill subtle">project scope only</span>
                </div>
                <p className="helper-text">
                  접근 권한이 있는 프로젝트 데이터만 집계하며, 집계 이후 원본 변경이 있으면 새로고침 후 최신 수치를 확인합니다.
                </p>
              </section>
            </div>
          </section>
          <DashboardWidgetGrid widgets={settingsData.widgets} />
          <ProjectHealthTable items={projectData.healthMetrics} />
          <div className="section-grid two-column">
            <TodayInspectionCard rounds={todayInspectionRounds} />
            <UpcomingInspectionList rounds={upcomingInspectionRounds} />
          </div>
          <div className="section-grid two-column">
            <ReportDueCard items={reportData.reportStatuses} />
            <SubmissionStatusCard items={reportData.submissionStatuses} />
          </div>
        </div>
        <div className="section-stack">
          <OpenFindingCard count={openFindingCount} />
          <FindingAgingChart buckets={findingsData.aging} />
          <ApprovalQueueCard approvals={approvalsData.approvals} />
          <SafetyCostUsageCard warnings={safetyCostData.warnings} />
          <MailFileActivityCard activity={filesMailData.activity} />
          <DashboardInsightPanel insightRun={insight.insightRun} />
          <AlertList alerts={alertsData.alerts} />
        </div>
      </div>
    </DashboardShell>
  );
}
