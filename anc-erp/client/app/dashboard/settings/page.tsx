import { DashboardShell, WidgetSettingsPanel, AlertRuleTable } from "../../../components/dashboard-components";
import { loadDashboardSettingsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardSettingsPage() {
  const pageData = await loadDashboardSettingsPageData();

  return (
    <DashboardShell title="대시보드 설정" subtitle="위젯 구성과 알림 규칙을 운영자 관점에서 조정합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <WidgetSettingsPanel widgets={pageData.widgets} />
        </div>
        <div className="section-stack">
          <AlertRuleTable rules={pageData.rules} />
        </div>
      </div>
    </DashboardShell>
  );
}

