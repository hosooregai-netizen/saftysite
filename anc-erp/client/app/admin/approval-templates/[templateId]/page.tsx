import { ApprovalTemplateEditor } from "../../../../components/approval-template-editor";
import { ApprovalTemplateTable } from "../../../../components/approval-template-table";
import { SubmissionDetailCard } from "../../../../components/admin-governance-components";
import { ErpShell } from "../../../../components/erp-shell";
import { loadAdminApprovalTemplateDetailPageData } from "../../../../lib/admin-page-data";

type ApprovalTemplateDetailPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function ApprovalTemplateDetailPage({ params }: ApprovalTemplateDetailPageProps) {
  const { templateId } = await params;
  const pageData = await loadAdminApprovalTemplateDetailPageData(templateId);

  return (
    <ErpShell title={`Approval Template: ${templateId}`} subtitle="개별 결재 템플릿 상세와 편집 화면입니다.">
      <SubmissionDetailCard detail={pageData.detail} />
      <ApprovalTemplateEditor detail={pageData.detail} />
      <ApprovalTemplateTable items={[pageData.detail]} />
    </ErpShell>
  );
}
