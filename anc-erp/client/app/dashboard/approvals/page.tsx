import { ApprovalQueueCard, DashboardShell, SignatureMissingList } from "../../../components/dashboard-components";
import { loadDashboardApprovalsPageData } from "../../../lib/dashboard-page-data";

export default async function DashboardApprovalsPage() {
  const pageData = await loadDashboardApprovalsPageData();

  return (
    <DashboardShell title="결재 큐" subtitle="문서별 approval workflow의 현재 단계와 required pending 건수를 추적합니다.">
      <div className="feature-split">
        <div className="section-stack">
          <ApprovalQueueCard approvals={pageData.approvals} />
        </div>
        <div className="section-stack">
          <SignatureMissingList approvals={pageData.approvals} />
        </div>
      </div>
    </DashboardShell>
  );
}
