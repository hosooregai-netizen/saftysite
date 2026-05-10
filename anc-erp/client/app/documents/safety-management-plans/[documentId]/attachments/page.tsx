import { AttachmentLinkPanel } from "../../../../../components/attachment-link-panel";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadSafetyManagementPlanDetailPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyManagementPlanAttachmentsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyManagementPlanDetailPageData(documentId);
  return (
    <ErpShell title="첨부자료" subtitle="웹하드 파일과 안전관리계획서 첨부섹션을 연결합니다.">
      <AttachmentLinkPanel planId={documentId} items={pageData.detail.attachments} />
    </ErpShell>
  );
}
