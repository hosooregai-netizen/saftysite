import { ApprovalFilterBar } from "../../../components/approval-filter-bar";
import { ApprovalWorkflowTable } from "../../../components/approval-workflow-table";
import { ErpShell } from "../../../components/erp-shell";
import { loadRequestedApprovalsPageData } from "../../../lib/approval-page-data";

export default async function ApprovalsRequestedPage() {
  const pageData = await loadRequestedApprovalsPageData();
  return (
    <ErpShell title="Requested Approvals" subtitle="내가 요청한 결재 workflow만 모아 보는 화면입니다.">
      <ApprovalFilterBar itemCount={pageData.items.length} scope="requested" />
      <ApprovalWorkflowTable items={pageData.items} />
    </ErpShell>
  );
}
