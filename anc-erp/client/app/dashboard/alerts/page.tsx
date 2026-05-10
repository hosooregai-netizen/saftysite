import { AlertList, AlertRuleTable, DashboardControlPanel, DashboardShell } from "../../../components/dashboard-components";
import { StatusBadge } from "../../../components/status-badge";
import { loadDashboardAlertsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardAlertsPage() {
  const pageData = await loadDashboardAlertsPageData();
  const openCount = pageData.alerts.filter((alert) => alert.status === "open").length;
  const acknowledgedCount = pageData.alerts.filter((alert) => alert.status === "acknowledged").length;

  return (
    <DashboardShell title="운영 경고" subtitle="지연, 장기 미조치, 산안비 경고를 refresh하고 확인/해제합니다.">
      <section className="hero-card dashboard-hero-card">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Alert Center</p>
            <h2 className="hero-title">활성 경고와 규칙을 한 화면에서 관리</h2>
            <p className="hero-subtitle">
              severity가 높은 경고를 먼저 보고, acknowledge/dismiss는 운영 정리용으로만 사용합니다.
            </p>
          </div>
        </div>
        <div className="dashboard-command-strip">
          <span className="pill outline">active</span>
          <span className="pill outline">acknowledged</span>
          <span className="pill outline">resolved</span>
          <span className="pill outline">severity filter</span>
        </div>
        <div className="hero-summary-grid dashboard-kpi-grid dashboard-alert-summary-grid">
          <article className="hero-summary-card dashboard-metric-card danger">
            <span>open alerts</span>
            <strong>{openCount}건</strong>
            <small>즉시 확인이 필요한 활성 경고</small>
          </article>
          <article className="hero-summary-card dashboard-metric-card review">
            <span>acknowledged</span>
            <strong>{acknowledgedCount}건</strong>
            <small>운영자가 확인 표시한 경고</small>
          </article>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <AlertList alerts={pageData.alerts} />
        </div>
        <div className="section-stack">
          <section className="missing-panel dashboard-inline-warning">
            <div className="hero-badges">
              <StatusBadge tone="warning" label="route handoff" />
              <span className="pill subtle">원본 이동 필수</span>
            </div>
            <p className="helper-text">알림 상태만 정리하고, 실제 조치와 상태 변경은 관련 프로젝트·문서·점검 화면에서 처리합니다.</p>
          </section>
          <DashboardControlPanel alerts={pageData.alerts} />
          <AlertRuleTable rules={pageData.rules} />
        </div>
      </div>
    </DashboardShell>
  );
}
