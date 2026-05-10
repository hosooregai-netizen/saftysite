import { DashboardShell, OwnerReportStatusMatrix, ReportDueCard, SubmissionStatusCard } from "../../../components/dashboard-components";
import { loadDashboardReportsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardReportsPage() {
  const pageData = await loadDashboardReportsPageData();

  return (
    <DashboardShell title="보고서 / 제출 현황" subtitle="발주처별 보고서 상태와 제출 지연을 문서 관점에서 추적합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <OwnerReportStatusMatrix items={pageData.reportStatuses} />
        </div>
        <div className="section-stack">
          <ReportDueCard items={pageData.reportStatuses} />
          <SubmissionStatusCard items={pageData.submissionStatuses} />
        </div>
      </div>
    </DashboardShell>
  );
}

