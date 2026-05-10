import { ApprovalFilterBar } from "../../../components/approval-filter-bar";
import { ApprovalWorkflowTable } from "../../../components/approval-workflow-table";
import { ErpShell } from "../../../components/erp-shell";
import { loadApprovalsInboxPageData } from "../../../lib/approval-page-data";

export default async function ApprovalsInboxPage() {
  const pageData = await loadApprovalsInboxPageData();
  return (
    <ErpShell title="Approvals Inbox" subtitle="나에게 배정된 결재 단계만 모아 보는 inbox 화면입니다.">
      <ApprovalFilterBar itemCount={pageData.items.length} scope="inbox" />
      <ApprovalWorkflowTable items={pageData.items} />
    </ErpShell>
  );
}
